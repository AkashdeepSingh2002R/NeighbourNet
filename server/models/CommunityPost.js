// server/models/CommunityPost.js
const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // set to true if you always attach the author
    },
    text: { type: String, trim: true },
    imageUrl: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true } // adds createdAt/updatedAt
);

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
