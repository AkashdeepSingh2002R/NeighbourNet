const Message = require('../models/Message');

const send = async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!req.userId) return res.status(401).json({ message: 'Not authenticated' });
    const msg = await Message.create({ from: req.userId, to, text });
    const io = req.app.get('io');
    if (io) {
      io.emit('message:new', { _id: msg._id, from: msg.from, to: msg.to, text: msg.text, createdAt: msg.createdAt });
    }
    res.json(msg);
  } catch (e) {
    console.error('message send error', e);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

const list = async (req, res) => {
  try {
    const { withUser } = req.query;
    if (!req.userId) return res.status(401).json({ message: 'Not authenticated' });
    const q = { $or: [{ from: req.userId, to: withUser }, { from: withUser, to: req.userId }] };
    const msgs = await Message.find(q).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load messages' });
  }
};

const markRead = async (req, res) => {
  try {
    const { withUser } = req.body;
    if (!req.userId) return res.status(401).json({ message: 'Not authenticated' });
    await Message.updateMany({ from: withUser, to: req.userId, readAt: null }, { $set: { readAt: new Date() } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark read' });
  }
};

module.exports = { send, list, markRead };
