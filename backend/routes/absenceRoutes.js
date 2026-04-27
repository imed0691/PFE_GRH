const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/absences', verifyToken, absenceController.reportAbsence);
router.get('/absences', verifyToken, absenceController.getAllAbsences);
router.put('/absences/read-admin', verifyToken, absenceController.markAsReadAdmin);
router.put('/absences/read-teacher', verifyToken, absenceController.markAsReadTeacher);
router.put('/absences/:id', verifyToken, absenceController.updateAbsenceStatus);

module.exports = router;
