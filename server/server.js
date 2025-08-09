// server/index.js (or server.js/app.js — whichever is your entry)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

/* ------------------------ TRUST PROXY FOR RENDER ------------------------ */
// Needed so `secure: true` cookies are set when running behind Render/Netlify/etc.
app.set('trust proxy', 1);

/* -------------------------- ORIGIN WHITELIST --------------------------- */
const ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// helpful log on boot
console.log('[CORS] Allowed origins:', ORIGINS);

/* ------------------------------ SOCKET.IO ------------------------------ */
const io = new Server(server, {
  cors: {
    origin: ORIGINS,
    credentials: true,
  },
});
app.set('io', io);

// simple presence (optional)
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
// CORS must be before routes
app.use(
  cors({
    origin: (origin, cb) => {
      // allow no-origin requests (curl, mobile apps) and whitelisted origins
      if (!origin || ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);

// Handle preflight on all routes
app.options('*', cors({ origin: ORIGINS, credentials: true }));

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
app.use('/api/communities', require('./routes/communityRoutes')); // ensure user route added there
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

/* ---------------------------- ERROR HANDLING ---------------------------- */
// unify JSON errors (prevents HTML error pages)
app.use((err, req, res, next) => {
  console.error('[Error]', err?.message || err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

/* --------------------------------- BOOT -------------------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
