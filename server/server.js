// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

/* ------------------------ TRUST PROXY (Render/Netlify) ------------------------ */
app.set('trust proxy', 1);

/* --------------------------------- CORS --------------------------------- */
const ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('[CORS] Allowed origins:', ORIGINS);

const corsOptions = {
  origin: ORIGINS,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight

/* ------------------------------ SOCKET.IO ------------------------------ */
const io = new Server(server, {
  cors: { origin: ORIGINS, credentials: true },
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

/* ------------------------------ MIDDLEWARE ----------------------------- */
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

/* --------------------------------- DB ---------------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('DB Error:', err));

/* -------------------------------- HEALTH -------------------------------- */
app.get('/api/health', (_, res) => res.json({ ok: true }));

/* -------------------------------- ROUTES -------------------------------- */
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/communities', require('./routes/communityRoutes')); // includes /user/:userId
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

/* ---------------------------- ERROR HANDLER ----------------------------- */
app.use((err, req, res, next) => {
  console.error('[Error]', err?.message || err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

/* ----------------------------- CATCH-ALL 404 ---------------------------- */
// Express 5-safe catch-all (avoid app.get('*', ...))
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

/* --------------------------------- BOOT -------------------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
