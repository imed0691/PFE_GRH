const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Academic session routes
router.get('/sessions', sessionController.getAllSessions);
router.post('/sessions', sessionController.createSession);
router.delete('/sessions/:id', sessionController.deleteSession);

module.exports = router;
