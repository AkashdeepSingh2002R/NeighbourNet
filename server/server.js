const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // enable secure cookies behind proxy (Render/HTTPS)
const server = http.createServer(app);

// --- Socket.io (fixes /socket.io 404) ---
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true
  }
});
app.set('io', io);

// Optional presence (works if client supplies auth.userId; safe to leave)
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

// --- Middleware ---
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// --- DB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('DB Error:', err));

// --- Health ---
app.get('/api/health', (_, res) => res.json({ ok: true }));

// --- Routes ---

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes')); // <= add this
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
