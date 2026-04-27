const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/documents', verifyToken, documentController.requestDocument);
router.get('/documents', verifyToken, documentController.getAllDocuments);
router.put('/documents/:id', verifyToken, documentController.updateDocumentStatus);

module.exports = router;
