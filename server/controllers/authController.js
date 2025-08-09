const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const cookieBase = { httpOnly: true, sameSite: 'none', secure: true, path: '/' };

function signAccess(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
function signRefresh(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, name });
    const access = signAccess(user);
    const refresh = signRefresh(user);
    res.cookie('accessToken', access, { ...cookieBase, maxAge: 7*24*60*60*1000 });
    res.cookie('refreshToken', refresh, { ...cookieBase, maxAge: 30*24*60*60*1000 });
    res.json({ ok: true, user: { _id: user._id, email: user.email, name: user.name } });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    const access = signAccess(user);
    const refresh = signRefresh(user);
    res.cookie('accessToken', access, { ...cookieBase, maxAge: 7*24*60*60*1000 });
    res.cookie('refreshToken', refresh, { ...cookieBase, maxAge: 30*24*60*60*1000 });
    res.json({ ok: true, user: { _id: user._id, email: user.email, name: user.name } });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const access = jwt.sign({ sub: payload.sub }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    res.cookie('accessToken', access, { ...cookieBase, maxAge: 7*24*60*60*1000 });
    res.json({ ok: true });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie('accessToken', { ...cookieBase });
  res.clearCookie('refreshToken', { ...cookieBase });
  res.json({ ok: true });
};
