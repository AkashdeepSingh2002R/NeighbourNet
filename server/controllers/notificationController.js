const Notification = require('../models/Notification');

const list = async (req, res) => {
  const rows = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50).populate('from','name avatar');
  res.json(rows);
};
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.userId, read: false }, { $set: { read: true } });
  res.json({ ok: true });
};

module.exports = { list, markAllRead };
