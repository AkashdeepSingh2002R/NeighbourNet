const express = require('express');
const { auth } = require('../middleware/auth');
const { searchAll } = require('../controllers/searchController');

const router = express.Router();
router.get('/', auth(false), searchAll);

module.exports = router;
