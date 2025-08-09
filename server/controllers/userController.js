const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function signAccessToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET || 'dev-secret', {
    subject: String(userId),
    expiresIn: '15m',
  });
}
function signRefreshToken(userId) {
  return jwt.sign({ type: 'refresh' }, process.env.JWT_SECRET || 'dev-secret', {
    subject: String(userId),
    expiresIn: '7d',
  });
}
function setAuthCookies(res, { at, rt }) {
  res.cookie('at', at, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000*60*15 });
  res.cookie('rt', rt, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000*60*60*24*7 });
}

// --- Auth ---
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email in use' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    const at = signAccessToken(user._id);
    const rt = signRefreshToken(user._id);
    setAuthCookies(res, { at, rt });
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ message: 'Registration failed', error: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const at = signAccessToken(user._id);
    const rt = signRefreshToken(user._id);
    setAuthCookies(res, { at, rt });
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ message: 'Login failed', error: e.message });
  }
};

const me = async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
};

const refresh = async (req, res) => {
  const token = req.cookies?.rt;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (payload.type !== 'refresh') return res.status(401).json({ message: 'Bad refresh token' });
    const at = signAccessToken(payload.sub);
    const rt = signRefreshToken(payload.sub);
    setAuthCookies(res, { at, rt });
    res.json({ ok: true });
  } catch {
    res.status(401).json({ message: 'Refresh failed' });
  }
};

const logout = (req, res) => {
  res.clearCookie('at');
  res.clearCookie('rt');
  res.json({ ok: true });
};

// --- Profile / Social ---
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
  await User.findByIdAndUpdate(me, { $addToSet: { following: them } });
  await User.findByIdAndUpdate(them, { $addToSet: { followers: me } });
  res.json({ ok: true });
};

const unfollow = async (req, res) => {
  const me = req.userId;
  const them = req.params.id;
  if (!me) return res.status(401).json({ message: 'Not authenticated' });
  if (!them) return res.status(400).json({ message: 'Missing target id' });
  await User.findByIdAndUpdate(me, { $pull: { following: them } });
  await User.findByIdAndUpdate(them, { $pull: { followers: me } });
  res.json({ ok: true });
};

const listSuggestions = async (req, res) => {
  const me = await User.findById(req.userId).lean();
  const users = await User.find({ _id: { $ne: req.userId, $nin: me?.following || [] } }).select('name avatar city');
  res.json(users);
};

const searchUsers = async (req, res) => {
  const q = req.query.q || '';
  const r = new RegExp(q, 'i');
  const users = await User.find({ $or: [{name:r},{city:r}] }).select('name avatar city area');
  res.json(users);
};

// --- Legacy compatibility (friends model) ---
const listUsers = async (req, res) => {
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

  // friends = mutual follows
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

  // requests = they follow you but you don't follow back
  const requests = await User.find({
    following: userId,
    _id: { $nin: me.following }
  }).select('name avatar city area').lean();

  res.json(requests);
};

module.exports = {
  register, login, me, refresh, logout, updateProfile,
  follow, unfollow, listSuggestions, searchUsers,
  // legacy
  listUsers, getFriends, getFriendRequests
};
