const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/reminders', verifyToken, reminderController.createReminder);
router.get('/reminders/teacher/:id', reminderController.getRemindersForTeacher);
router.put('/reminders/read', verifyToken, reminderController.markAsRead);
router.delete('/reminders/hide-all', verifyToken, reminderController.deleteAllReminders);
router.delete('/reminders/:id/hide', verifyToken, reminderController.deleteReminder);

module.exports = router;
