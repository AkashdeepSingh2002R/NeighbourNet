// server/routes/communityPostRoutes.js
const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');

router.post('/', async (req, res) => {
  try {
    const { communityId, author, text, imageUrl } = req.body;
    if (!communityId) return res.status(400).json({ message: 'communityId required' });

    const post = await CommunityPost.create({ communityId, author, text, imageUrl });
    res.json(post);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create', error: e.message });
  }
});

router.get('/:communityId', async (req, res) => {
  try {
    const posts = await CommunityPost
      .find({ communityId: req.params.communityId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load', error: e.message });
  }
});

module.exports = router;
