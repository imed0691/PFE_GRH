const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/salaries', salaryController.calculateSalaries);
router.put('/salaries/:id', salaryController.updateSalary);

module.exports = router;
