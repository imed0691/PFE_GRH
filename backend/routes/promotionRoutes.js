const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const verifyToken = require('../middlewares/authMiddleware');

const multer = require('multer');
const path = require('path');

// Configuration Multer for promotion files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'promotions'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/promotions', verifyToken, upload.single('file'), promotionController.requestPromotion);
router.get('/promotions', verifyToken, promotionController.getAllPromotions);
router.put('/promotions/:id/recommend', verifyToken, promotionController.recommendPromotion);
router.put('/promotions/:id/status', verifyToken, promotionController.approveRejectPromotion);

module.exports = router;
