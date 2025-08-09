// routes/communityRoutes.js
const express = require('express');
const router = express.Router();
const { create, list, join, leave, feed, userCommunities } =
  require('../controllers/communityController');
const { auth } = require('../middlewares/auth'); // if your auth exports a function

// public list (optional)
router.get('/', list);

// ✅ NEW: user’s communities
router.get('/user/:userId', auth(), userCommunities);

// create/join/leave/feed
router.post('/', auth(), create);
router.post('/:id/join', auth(), join);
router.post('/:id/leave', auth(), leave);
router.get('/:id/feed', auth(), feed);

module.exports = router;
