// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TTL_MS  = 15 * 60 * 1000;            // 15 minutes
const REFRESH_TTL_MS = 7  * 24 * 60 * 60 * 1000;  // 7 days

function signAccessToken(userId) {
  // Use ONE secret consistently across sign + verify
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET, { expiresIn: '7d' });
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    secure:   isProd,           // true on Render/production so cookies are set over HTTPS
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };

  // IMPORTANT: these names must match middleware
  res.cookie('accessToken',  accessToken,  { ...base, maxAge: ACCESS_TTL_MS  });
  res.cookie('refreshToken', refreshToken, { ...base, maxAge: REFRESH_TTL_MS });
}

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, name });

    const at = signAccessToken(user._id.toString());
    const rt = signRefreshToken(user._id.toString());
    setAuthCookies(res, { accessToken: at, refreshToken: rt });

    res.status(201).json({ user: { _id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('register error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const at = signAccessToken(user._id.toString());
    const rt = signRefreshToken(user._id.toString());
    setAuthCookies(res, { accessToken: at, refreshToken: rt });

    res.json({ user: { _id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('login error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET);
    const at = signAccessToken(payload.sub);
    const rt = signRefreshToken(payload.sub);

    setAuthCookies(res, { accessToken: at, refreshToken: rt });
    res.json({ ok: true });
  } catch (e) {
    console.error('refresh error:', e);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (_req, res) => {
  // Clear cookies
  res.clearCookie('accessToken',  { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ ok: true });
};
