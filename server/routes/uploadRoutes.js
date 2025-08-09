const express = require('express');
const { auth } = require('../middleware/auth');
const { signUpload } = require('../utils/cloudinary');

const router = express.Router();

// Client asks for a signature, we respond with timestamp + signature
router.get('/sign', auth(), (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'neighbournet'; // optional folder to keep things tidy
  const signature = signUpload({ timestamp, folder });
  res.json({
    timestamp,
    signature,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  });
});

module.exports = router;
