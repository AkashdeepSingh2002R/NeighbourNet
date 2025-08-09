const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  imageUrl: String,
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hashtags: [String],
  comments: [commentSchema],
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
