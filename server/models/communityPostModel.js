const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  message: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', communityPostSchema);
