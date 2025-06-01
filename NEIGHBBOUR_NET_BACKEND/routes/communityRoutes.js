const express = require('express');
const router = express.Router();
const {
  createCommunity,
  getAllCommunities,
  joinCommunity,
  getUserCommunities,
  getCommunityById,
  leaveCommunity,
  deleteCommunity
} = require('../controllers/communityController');

router.post('/', createCommunity);
router.get('/', getAllCommunities);
router.get('/user/:userId', getUserCommunities);
router.get('/:id', getCommunityById);
router.post('/:id/join', joinCommunity);
router.post('/:id/leave', leaveCommunity);
router.delete('/:id', deleteCommunity);

module.exports = router;
