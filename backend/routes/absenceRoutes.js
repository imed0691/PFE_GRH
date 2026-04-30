const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');
const verifyToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration Multer pour les justifications
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/justifications/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/absences', verifyToken, absenceController.markAbsence);
router.get('/absences', verifyToken, absenceController.getAllAbsences);
router.put('/absences/read-admin', verifyToken, absenceController.markAsReadAdmin);
router.put('/absences/read-teacher', verifyToken, absenceController.markAsReadTeacher);

// Teacher actions: justify and catch-up
router.put('/absences/:id/justify', verifyToken, upload.single('justification_file'), absenceController.submitJustification);
router.put('/absences/:id/catchup', verifyToken, absenceController.submitCatchup);

router.delete('/absences/bulk-delete', verifyToken, absenceController.bulkDeleteAbsences);
router.put('/absences/:id', verifyToken, absenceController.updateAbsenceStatus);
router.delete('/absences/:id', verifyToken, absenceController.deleteAbsence);

module.exports = router;
