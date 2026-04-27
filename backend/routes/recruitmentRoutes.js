const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/recruitments', verifyToken, recruitmentController.requestRecruitment);
router.get('/recruitments', verifyToken, recruitmentController.getAllRecruitments);
router.put('/recruitments/:id', verifyToken, recruitmentController.updateRecruitmentStatus);

module.exports = router;
