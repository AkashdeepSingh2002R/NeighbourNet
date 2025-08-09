// server/routes/communityRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  create,
  list,
  join,
  leave,
  feed,
  userCommunities,
} = require('../controllers/communityController');

router.get('/', list);
router.get('/user/:userId', auth(), userCommunities); // â† added
router.post('/', auth(), create);
router.post('/:id/join', auth(), join);
router.post('/:id/leave', auth(), leave);
router.get('/:id/feed', auth(), feed);

module.exports = router;
