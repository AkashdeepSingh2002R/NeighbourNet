const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');

const searchAll = async (req, res) => {
  const q = (req.query.q || '').trim();
  const r = new RegExp(q, 'i');
  const [users, posts, communities] = await Promise.all([
    User.find({ $or:[{name:r},{city:r},{area:r}] }).select('name avatar city area'),
    Post.find({ $or:[{text:r},{hashtags:r}] }).limit(20),
    Community.find({ $or:[{name:r},{postal:r}] }).limit(20),
  ]);
  res.json({ users, posts, communities });
};

module.exports = { searchAll };
