const User = require('../models/User');

exports.me = async (req, res) => {
  const u = await User.findById(req.userId)
    .select('_id email name city area postalCode avatar');
  res.json(u);
};

exports.listUsers = async (_req, res) => {
  const rows = await User.find()
    .select('_id name email city area avatar')
    .limit(200);
  res.json(rows);
};

exports.getFriends = async (req, res) => {
  const { userId } = req.params;
  const u = await User.findById(userId).select('friends');
  const ids = Array.isArray(u?.friends) ? u.friends : [];
  const rows = await User.find({ _id: { $in: ids } })
    .select('_id name city area avatar');
  res.json(rows);
};

exports.getFriendRequests = async (req, res) => {
  const { userId } = req.params;
  const u = await User.findById(userId).select('friendRequests');
  const ids = Array.isArray(u?.friendRequests) ? u.friendRequests : [];
  const rows = await User.find({ _id: { $in: ids } })
    .select('_id name city area avatar');
  res.json(rows);
};

exports.follow = async (req, res) => {
  const { targetId } = req.params;      // the user you want to add
  const me = req.userId;

  if (me === targetId) return res.status(400).json({ message: 'Cannot friend yourself' });

  // add pending request on target
  await User.findByIdAndUpdate(targetId, { $addToSet: { friendRequests: me } });

  res.json({ ok: true });
};

exports.unfollow = async (req, res) => {
  const { targetId } = req.params;
  const me = req.userId;

  // remove from my friends and theirs; also clear pending
  await User.findByIdAndUpdate(me, { $pull: { friends: targetId } });
  await User.findByIdAndUpdate(targetId, { $pull: { friends: me, friendRequests: me } });

  res.json({ ok: true });
};

// Optionally, accept request
exports.acceptRequest = async (req, res) => {
  const { senderId } = req.params; // who sent me a request
  const me = req.userId;

  // remove from my pending; add both to friends
  await User.findByIdAndUpdate(me, { 
    $pull: { friendRequests: senderId },
    $addToSet: { friends: senderId }
  });
  await User.findByIdAndUpdate(senderId, { $addToSet: { friends: me } });

  res.json({ ok: true });
};
