const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsers,
  getFriends,
  sendFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  acceptFriendRequest
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', getAllUsers);
router.get('/:id/friends', getFriends);
router.post('/:id/send-request', sendFriendRequest);
router.post('/:id/cancel-request', cancelFriendRequest);
router.get('/:id/friend-requests', getFriendRequests);
router.post('/:id/accept-request', acceptFriendRequest);

module.exports = router;
