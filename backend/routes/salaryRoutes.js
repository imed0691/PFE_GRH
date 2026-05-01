const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

const verifyToken = require('../middlewares/authMiddleware');

router.get('/salaries', salaryController.calculateSalaries);
router.get('/my-salary', verifyToken, salaryController.getMySalary);
router.put('/salaries/:id', salaryController.updateSalary);
router.put('/salaries/:id/recalculate', salaryController.recalculateSalary);
router.post('/salaries/finalize', verifyToken, salaryController.finalizeMonth);

module.exports = router;
