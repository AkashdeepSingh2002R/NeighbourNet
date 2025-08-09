const express = require('express');
const { auth } = require('../middleware/auth');
const { list, markAllRead } = require('../controllers/notificationController');

const router = express.Router();
router.get('/', auth(), list);
router.post('/read-all', auth(), markAllRead);

module.exports = router;
