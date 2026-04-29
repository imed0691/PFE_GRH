const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const verifyToken = require('../middlewares/authMiddleware');

// Routes pour les Niveaux (Study Levels)
router.get('/classes/levels', verifyToken, classController.getStudyLevels);
router.post('/classes/levels', verifyToken, classController.createStudyLevel);
router.delete('/classes/levels/:id', verifyToken, classController.deleteStudyLevel);

// Routes pour les Sections
router.get('/classes/sections', verifyToken, classController.getSections);
router.post('/classes/sections', verifyToken, classController.createSection);
router.delete('/classes/sections/:id', verifyToken, classController.deleteSection);

// Routes pour les Groupes
router.get('/classes/groups', verifyToken, classController.getStudentGroups);
router.post('/classes/groups', verifyToken, classController.createStudentGroup);
router.delete('/classes/groups/:id', verifyToken, classController.deleteStudentGroup);

// Routes pour les Modules
router.get('/classes/modules', verifyToken, classController.getModules);
router.post('/classes/modules', verifyToken, classController.createModule);
router.delete('/classes/modules/:id', verifyToken, classController.deleteModule);

// Routes pour l'assignation Prof-Module
router.get('/classes/teacher-modules', verifyToken, classController.getTeacherModules);
router.post('/classes/teacher-modules', verifyToken, classController.assignModule);
router.delete('/classes/teacher-modules', verifyToken, classController.unassignModule);

module.exports = router;
