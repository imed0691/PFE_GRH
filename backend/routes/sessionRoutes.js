const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const verifyToken = require('../middlewares/authMiddleware');

// Academic session routes
router.get('/sessions', verifyToken, sessionController.getAllSessions);
router.post('/sessions', verifyToken, sessionController.createSession);
router.delete('/sessions/:id', verifyToken, sessionController.deleteSession);
router.get('/modules', verifyToken, sessionController.getModules);

// Teacher dashboard route
router.get('/teacher/dashboard/:id', verifyToken, sessionController.getTeacherDashboardData);

// Past sessions for absence marking
router.get('/sessions/past', verifyToken, sessionController.getRecentPastSessions);

module.exports = router;
