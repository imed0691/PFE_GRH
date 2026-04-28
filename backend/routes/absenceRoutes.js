const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/absences', verifyToken, absenceController.markAbsence);
router.get('/absences', verifyToken, absenceController.getAllAbsences);
router.put('/absences/read-admin', verifyToken, absenceController.markAsReadAdmin);
router.put('/absences/read-teacher', verifyToken, absenceController.markAsReadTeacher);

// Teacher actions: justify and catch-up
router.put('/absences/:id/justify', verifyToken, absenceController.submitJustification);
router.put('/absences/:id/catchup', verifyToken, absenceController.submitCatchup);

router.put('/absences/:id', verifyToken, absenceController.updateAbsenceStatus);

module.exports = router;
