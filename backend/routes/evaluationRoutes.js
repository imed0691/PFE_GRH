const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/evaluations', verifyToken, evaluationController.createEvaluation);
router.get('/evaluations', verifyToken, evaluationController.getEvaluations);

module.exports = router;
