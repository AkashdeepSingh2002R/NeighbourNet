const express = require('express');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../utils/limits');
const {
  register, login, me, refresh, logout, updateProfile,
  follow, unfollow, listSuggestions, searchUsers,
  listUsers, getFriends, getFriendRequests
} = require('../controllers/userController');

const router = express.Router();

// Auth
router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',        auth(),      me);
router.put('/me',        auth(),      updateProfile);
router.post('/refresh',  refresh);
router.post('/logout',   logout);

// Profile / Social
router.patch('/me',      auth(),      updateProfile);

// Friend / follow
router.post('/:id/follow',        auth(), follow);
router.post('/:id/unfollow',      auth(), unfollow);

// Public
router.get('/suggestions',        auth(false), listSuggestions);
router.get('/search',             auth(false), searchUsers);

// Legacy / Home.jsx
router.get('/',                   auth(false), listUsers);
router.get('/:id/friends',        auth(false), getFriends);
router.get('/:id/friend-requests',auth(false), getFriendRequests);

module.exports = router;
