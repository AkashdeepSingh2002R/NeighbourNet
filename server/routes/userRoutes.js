const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

router.get('/me', auth(), async (req, res) => {
  // return minimal user
  const User = require('../models/User');
  const u = await User.findById(req.userId).select('_id email name city area avatar');
  res.json(u);
});

module.exports = router;
