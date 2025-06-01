const User = require('../models/User');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, city, postalCode } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, city, postalCode });
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

const getFriends = async (req, res) => {
  const user = await User.findById(req.params.id).populate('friends', '-password');
  res.json(user.friends);
};

const sendFriendRequest = async (req, res) => {
  const { targetId } = req.body;
  const senderId = req.params.id;

  const targetUser = await User.findById(targetId);
  if (!targetUser.friendRequests.includes(senderId)) {
    targetUser.friendRequests.push(senderId);
    await targetUser.save();
  }

  res.json({ message: 'Request sent' });
};

const cancelFriendRequest = async (req, res) => {
  const { targetId } = req.body;
  const senderId = req.params.id;

  const targetUser = await User.findById(targetId);
  targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== senderId);
  await targetUser.save();

  res.json({ message: 'Request cancelled' });
};

const getFriendRequests = async (req, res) => {
  const user = await User.findById(req.params.id).populate('friendRequests', '-password');
  res.json(user.friendRequests);
};

const acceptFriendRequest = async (req, res) => {
  const { senderId } = req.body;
  const receiver = await User.findById(req.params.id);

  receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);
  if (!receiver.friends.includes(senderId)) receiver.friends.push(senderId);
  await receiver.save();

  const sender = await User.findById(senderId);
  if (!sender.friends.includes(receiver._id)) sender.friends.push(receiver._id);
  await sender.save();

  res.json({ message: 'Friend request accepted' });
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getFriends,
  sendFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  acceptFriendRequest
};
