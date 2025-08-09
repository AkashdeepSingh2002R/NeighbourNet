const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  label: String,
  url: String
}, {_id:false});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  cover: String,
  bio: String,
  city: String,
  area: String,
  postalCode: String,
  links: [linkSchema],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  private: { type: Boolean, default: false },
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
