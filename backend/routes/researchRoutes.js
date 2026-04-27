const express = require('express');
const router = express.Router();
const researchController = require('../controllers/researchController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/research', verifyToken, researchController.addResearchActivity);
router.get('/research', verifyToken, researchController.getResearchActivities);

module.exports = router;
