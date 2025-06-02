const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/communityPostModel'); // ✅ exact file name

router.post('/', async (req, res) => {
  const post = new CommunityPost(req.body);
  await post.save();
  res.json(post);
});

router.get('/:communityId', async (req, res) => {
  const posts = await CommunityPost.find({ communityId: req.params.communityId });
  res.json(posts);
});

module.exports = router;
