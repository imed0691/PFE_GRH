const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.post('/reminders', reminderController.createReminder);
router.get('/reminders/teacher/:id', reminderController.getRemindersForTeacher);

module.exports = router;
