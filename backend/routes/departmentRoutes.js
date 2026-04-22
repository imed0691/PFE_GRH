const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Routes pour les départements
router.get('/departments', departmentController.getAllDepartments);
router.post('/departments', departmentController.createDepartment);
router.delete('/departments/:id', departmentController.deleteDepartment);

module.exports = router;
