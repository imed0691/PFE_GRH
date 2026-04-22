const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Routes pour les séances académiques
router.get('/sessions', sessionController.getAllSessions);
router.post('/sessions', sessionController.createSession);
router.delete('/sessions/:id', sessionController.deleteSession);

module.exports = router;
