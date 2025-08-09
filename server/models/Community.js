const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: String,
  street: String,
  postal: String,
  description: String,
  image: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Community', communitySchema);
