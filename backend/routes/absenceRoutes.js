const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');

router.post('/absences', absenceController.reportAbsence);
router.get('/absences', absenceController.getAllAbsences);
router.put('/absences/:id', absenceController.updateAbsenceStatus);

module.exports = router;
