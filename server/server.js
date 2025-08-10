const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // secure cookies behind proxy/CDN
const server = http.createServer(app);

// --- CORS ---
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,https://localhost:5173').split(',');
app.use(cors({
  origin: function (origin, cb) {
    // allow no-origin (curl/health checks) and listed origins
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// --- Socket.io ---
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
app.set('io', io);

const online = new Map();
io.on('connection', (socket) => {
  const { userId } = socket.handshake.auth || {};
  if (userId) {
    online.set(userId, socket.id);
    io.emit('presence:update', { userId, online: true });
  }
  socket.on('disconnect', () => {
    if (userId) {
      online.delete(userId);
      io.emit('presence:update', { userId, online: false });
    }
  });
});

// --- DB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('DB Error:', err));

// --- Routes ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/posts',         require('./routes/postRoutes'));
app.use('/api/communities',   require('./routes/communityRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search',        require('./routes/searchRoutes'));
app.use('/api/uploads',       require('./routes/uploadRoutes'));

// --- Start ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
