const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/promotions', verifyToken, promotionController.requestPromotion);
router.get('/promotions', verifyToken, promotionController.getAllPromotions);
router.put('/promotions/:id/recommend', verifyToken, promotionController.recommendPromotion);
router.put('/promotions/:id/status', verifyToken, promotionController.approveRejectPromotion);

module.exports = router;
