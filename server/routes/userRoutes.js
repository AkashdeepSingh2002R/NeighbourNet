const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/userController');
const authCtrl = require('../controllers/authController');

// auth endpoints (already added)
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', authCtrl.logout);

// session
router.get('/me', auth(), ctrl.me);

// ✅ users
router.get('/', auth(), ctrl.listUsers);

// ✅ social
router.get('/:userId/friends', auth(), ctrl.getFriends);
router.get('/:userId/friend-requests', auth(), ctrl.getFriendRequests);
router.post('/:targetId/follow', auth(), ctrl.follow);
router.post('/:targetId/unfollow', auth(), ctrl.unfollow);

module.exports = router;
