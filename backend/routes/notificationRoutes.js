const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/notifications/counts', verifyToken, notificationController.getCounts);
router.put('/notifications/seen/:section', verifyToken, notificationController.markSeen);

module.exports = router;
