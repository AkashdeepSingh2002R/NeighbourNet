const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TTL_MS  = 15 * 60 * 1000;        // 15m
const REFRESH_TTL_MS = 7  * 24 * 60 * 60 * 1000; // 7d

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
function signRefreshToken(userId) {
  return jwt.sign({ sub: String(userId), type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET, { expiresIn: '7d' });
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure:   isProd,
    path: '/',
  };
  res.cookie('accessToken',  accessToken,  { ...base, maxAge: ACCESS_TTL_MS });
  res.cookie('refreshToken', refreshToken, { ...base, maxAge: REFRESH_TTL_MS });
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    const at = signAccessToken(user._id);
    const rt = signRefreshToken(user._id);
    setAuthCookies(res, { accessToken: at, refreshToken: rt });

    res.status(201).json({ _id: user._id, name: user.name, email: user.email });
  } catch (e) {
    console.error('register error:', e);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const at = signAccessToken(user._id);
    const rt = signRefreshToken(user._id);
    setAuthCookies(res, { accessToken: at, refreshToken: rt });

    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (e) {
    console.error('login error:', e);
    res.status(500).json({ message: 'Login failed' });
  }
};

const me = async (req, res) => {
  if (!req.userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await User.findById(req.userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET, { clockTolerance: 60 });
    if (payload.type !== 'refresh') return res.status(401).json({ message: 'Bad refresh token' });

    const at = signAccessToken(payload.sub);
    const rt = signRefreshToken(payload.sub);
    setAuthCookies(res, { accessToken: at, refreshToken: rt });

    res.json({ ok: true });
  } catch (e) {
    console.error('refresh error:', e);
    res.status(401).json({ message: 'Refresh failed' });
  }
};

const logout = (_req, res) => {
  res.clearCookie('accessToken',  { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ ok: true });
};

const updateProfile = async (req, res) => {
  const allowed = ['name','avatar','cover','bio','city','area','postalCode','links','private'];
  const patch = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

  const user = await User.findByIdAndUpdate(req.userId, { $set: patch }, { new: true }).select('-password');
  res.json(user);
};

const follow = async (req, res) => {
  const me = req.userId;
  const them = req.params.id;
  if (!me) return res.status(401).json({ message: 'Not authenticated' });
  if (!them) return res.status(400).json({ message: 'Missing target id' });
  if (String(me) === String(them)) return res.status(400).json({ message: 'Cannot follow yourself' });

  await User.findByIdAndUpdate(me,   { $addToSet: { following: them } });
  await User.findByIdAndUpdate(them, { $addToSet: { followers: me } });
  res.json({ ok: true });
};

const unfollow = async (req, res) => {
  const me = req.userId;
  const them = req.params.id;
  if (!me) return res.status(401).json({ message: 'Not authenticated' });
  if (!them) return res.status(400).json({ message: 'Missing target id' });

  await User.findByIdAndUpdate(me,   { $pull: { following: them } });
  await User.findByIdAndUpdate(them, { $pull: { followers: me } });
  res.json({ ok: true });
};

const listSuggestions = async (req, res) => {
  let excluding = [];
  if (req.userId) {
    const me = await User.findById(req.userId).select('following').lean();
    excluding = me?.following || [];
  }
  const users = await User.find({ _id: { $nin: [req.userId, ...excluding].filter(Boolean) } })
    .select('name avatar city')
    .limit(50);
  res.json(users);
};

const searchUsers = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const r = new RegExp(q, 'i');
  const users = await User.find({ $or: [{ name: r }, { city: r }] })
    .select('name avatar city area')
    .limit(50);
  res.json(users);
};

const listUsers = async (_req, res) => {
  const users = await User.find({})
    .select('name avatar city area followers following createdAt')
    .limit(100)
    .lean();
  res.json(users);
};

const getFriends = async (req, res) => {
  const userId = req.params.id;
  const me = await User.findById(userId).select('following').lean();
  if (!me) return res.status(404).json({ message: 'User not found' });

  const friends = await User.find({
    _id: { $in: me.following },
    followers: userId
  }).select('name avatar city area').lean();

  res.json(friends);
};

const getFriendRequests = async (req, res) => {
  const userId = req.params.id;
  const me = await User.findById(userId).select('following').lean();
  if (!me) return res.status(404).json({ message: 'User not found' });

  const requests = await User.find({
    following: userId,
    _id: { $nin: me.following }
  }).select('name avatar city area').lean();

  res.json(requests);
};

module.exports = {
  register, login, me, refresh, logout, updateProfile,
  follow, unfollow, listSuggestions, searchUsers,
  listUsers, getFriends, getFriendRequests
};
