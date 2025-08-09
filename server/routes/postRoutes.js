const express = require('express');
const { auth } = require('../middleware/auth');
const { strictLimiter } = require('../utils/limits');
const { createPost, getFeed, toggleLike, comment, toggleBookmark, updatePost, deletePost, trending } = require('../controllers/postController');

const router = express.Router();

router.get('/feed', auth(false), getFeed);
router.get('/trending', trending);
router.post('/', auth(), strictLimiter, createPost);
router.post('/:id/like', auth(), toggleLike);
router.post('/:id/comment', auth(), comment);
router.post('/:id/bookmark', auth(), toggleBookmark);
router.patch('/:id', auth(), updatePost);
router.delete('/:id', auth(), deletePost);

module.exports = router;
