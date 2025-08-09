const Post = require('../models/Post');
const Notification = require('../models/Notification');

function extractHashtags(text='') {
  return (text.match(/#\w+/g) || []).map(h => h.toLowerCase());
}

const createPost = async (req, res) => {
  const { text, imageUrl, communityId } = req.body;
  const post = await Post.create({ author: req.userId, text, imageUrl, communityId, hashtags: extractHashtags(text) });
  res.json(post);
};

const getFeed = async (req, res) => {
  const { type='global', cursor=null, limit=10 } = req.query;
  const q = { deletedAt: null };
  if (cursor) q._id = { $lt: cursor };
  const posts = await Post.find(q).sort({ _id: -1 }).limit(Number(limit)).populate('author','name avatar');
  res.json({ items: posts, nextCursor: posts.length ? posts[posts.length-1]._id : null });
};

const toggleLike = async (req, res) => {
  const postId = req.params.id;
  const userId = req.userId;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: 'Not found' });
  const has = post.likes.some(u => String(u) === String(userId));
  if (has) {
    post.likes.pull(userId);
  } else {
    post.likes.addToSet(userId);
    if (String(post.author) !== String(userId)) {
      await Notification.create({ user: post.author, type:'like', from:userId, entityId: post._id });
    }
  }
  await post.save();
  res.json({ likes: post.likes.length, liked: !has });
};

const comment = async (req, res) => {
  const postId = req.params.id;
  const { text } = req.body;
  const post = await Post.findByIdAndUpdate(postId, { $push: { comments: { author: req.userId, text } } }, { new: true });
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (String(post.author) !== String(req.userId)) {
    await Notification.create({ user: post.author, type:'comment', from:req.userId, entityId: post._id });
  }
  res.json(post);
};

const toggleBookmark = async (req, res) => {
  const postId = req.params.id;
  const userId = req.userId;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: 'Not found' });
  const has = post.bookmarks.some(u => String(u) === String(userId));
  if (has) post.bookmarks.pull(userId);
  else post.bookmarks.addToSet(userId);
  await post.save();
  res.json({ bookmarked: !has });
};

const updatePost = async (req, res) => {
  const postId = req.params.id;
  const patch = {};
  ['text','imageUrl'].forEach(k => { if (k in req.body) patch[k] = req.body[k]; });
  const post = await Post.findOneAndUpdate({ _id: postId, author: req.userId }, { $set: patch, hashtags: req.body.text ? extractHashtags(req.body.text) : undefined }, { new: true });
  if (!post) return res.status(404).json({ message: 'Not found or not owner' });
  res.json(post);
};

const deletePost = async (req, res) => {
  const postId = req.params.id;
  const post = await Post.findOneAndUpdate({ _id: postId, author: req.userId }, { $set: { deletedAt: new Date() } }, { new: true });
  if (!post) return res.status(404).json({ message: 'Not found or not owner' });
  res.json({ ok: true });
};

const trending = async (req, res) => {
  const tags = await Post.aggregate([
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  res.json(tags.map(t => ({ tag: t._id, count: t.count })));
};

module.exports = { createPost, getFeed, toggleLike, comment, toggleBookmark, updatePost, deletePost, trending };
