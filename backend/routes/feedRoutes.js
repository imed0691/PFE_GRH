const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/feed', verifyToken, feedController.getFeed);

module.exports = router;
