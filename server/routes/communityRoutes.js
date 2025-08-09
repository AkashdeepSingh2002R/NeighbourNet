const express = require('express');
const { auth } = require('../middleware/auth');
const { create, list, join, leave, feed } = require('../controllers/communityController');

const router = express.Router();
router.get('/', list);
router.post('/', auth(), create);
router.post('/:id/join', auth(), join);
router.post('/:id/leave', auth(), leave);
router.get('/:id/feed', auth(false), feed);

module.exports = router;
