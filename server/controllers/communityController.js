// controllers/communityController.js
const Community = require('../models/Community');
const Post = require('../models/Post');

const create = async (req, res) => {
  const { name, description, street, postal, image } = req.body;
  const c = await Community.create({
    name, description, street, postal, image,
    creator: req.userId,
    members: [req.userId],
  });
  res.json(c);
};

const list = async (req, res) => {
  const rows = await Community.find().limit(100);
  res.json(rows);
};

const join = async (req, res) => {
  const id = req.params.id;
  await Community.findByIdAndUpdate(id, { $addToSet: { members: req.userId } });
  res.json({ ok: true });
};

const leave = async (req, res) => {
  const id = req.params.id;
  await Community.findByIdAndUpdate(id, { $pull: { members: req.userId } });
  res.json({ ok: true });
};

const feed = async (req, res) => {
  const id = req.params.id;
  const posts = await Post.find({ communityId: id, deletedAt: null })
    .sort({ _id: -1 })
    .limit(50);
  res.json(posts);
};

// ✅ NEW: get communities where the user is a member
const userCommunities = async (req, res) => {
  const { userId } = req.params;
  const rows = await Community.find({ members: userId }).limit(100);
  res.json(rows);
};

module.exports = { create, list, join, leave, feed, userCommunities };
