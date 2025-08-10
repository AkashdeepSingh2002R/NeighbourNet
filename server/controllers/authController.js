// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TTL_MS = 1000 * 60 * 15;           // 15m
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7d

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: '15m' });
}
function signRefreshToken(userId) {
  return jwt.sign({ sub: String(userId), type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookies(res, { at, rt }) {
  const isProd = process.env.NODE_ENV === 'production';

  // For Netlify(frontend) + Render(backend) on separate domains we need SameSite=None + Secure
  const common = {
    httpOnly: true,
    secure: isProd,           // must be true in prod (HTTPS)
    sameSite: isProd ? 'none' : 'lax',
    path: '/',                // send cookie to all routes
  };

  res.cookie('at', at, { ...common, maxAge: ACCESS_TTL_MS });
  res.cookie('rt', rt, { ...common, maxAge: REFRESH_TTL_MS });
}

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, name });

    const at = signAccessToken(user._id);
    const rt = signRefreshToken(user._id);
    setAuthCookies(res, { at, rt });

    // No redirect; return JSON so Set-Cookie survives on mobile
    res.status(201).json({ user: { _id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const at = signAccessToken(user._id);
    const rt = signRefreshToken(user._id);
    setAuthCookies(res, { at, rt });

    res.json({ user: { _id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.me = async (req, res) => {
  // Expect req.user set by auth middleware (reads 'at' cookie)
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  res.json({ user: req.user });
};

exports.refresh = async (req, res) => {
  try {
    const { rt } = req.cookies || {};
    if (!rt) return res.status(401).json({ message: 'Missing refresh token' });

    const payload = jwt.verify(rt, process.env.JWT_SECRET, { clockTolerance: 60 }); // tolerate 60s skew
    if (payload.type !== 'refresh') return res.status(401).json({ message: 'Invalid token' });

    const at = signAccessToken(payload.sub);
    const newRt = signRefreshToken(payload.sub);
    setAuthCookies(res, { at, rt: newRt });

    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ message: 'Refresh failed' });
  }
};
