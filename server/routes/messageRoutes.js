const express = require('express');
const { auth } = require('../middleware/auth');
const { send, list, markRead } = require('../controllers/messageController');

const router = express.Router();
router.get('/', auth(), list);
router.post('/', auth(), send);
router.post('/read', auth(), markRead);

module.exports = router;
