const db = require('../config/db');

// RH / Chef Dept: Créer un rappel
exports.createReminder = (req, res) => {
  const { recipient_id, text, type, recipient_type } = req.body;
  const message = text;
  const teacher_id = recipient_id;
  const sender_id = req.user ? req.user.id : null;
  const sender_dept_id = req.user ? req.user.department_id : null;

  if (!message) {
    return res.status(400).json({ message: "Le message est requis." });
  }

  let department_id = null;
  let final_teacher_id = teacher_id || null;

  if (recipient_type === 'dept') {
    department_id = sender_dept_id;
    final_teacher_id = null; // Broadcast to entire department
  }

  const query = "INSERT INTO reminders (teacher_id, sender_id, message, type, department_id) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [final_teacher_id, sender_id, message, type || 'info', department_id], (err, result) => {
    if (err) {
      console.error("Reminder DB Error:", err);
      return res.status(500).json({ message: "Database error: " + err.message });
    }
    res.status(201).json({ message: "Rappel envoyé." });
  });
};

// Obtenir les rappels (utilisé par le Teacher Dashboard)
exports.getRemindersForTeacher = (req, res) => {
  const { id } = req.params;
  
  // First get user's department
  db.query('SELECT department_id FROM users WHERE id = ?', [id], (err, userRes) => {
    if (err) return res.status(500).json({ error: err.message });
    const userDeptId = userRes.length > 0 ? userRes[0].department_id : null;

    const query = `
      SELECT r.*, u.nom as sender_nom, u.prenom as sender_prenom, u.role as sender_role 
      FROM reminders r 
      LEFT JOIN users u ON r.sender_id = u.id 
      LEFT JOIN reminder_status rs ON r.id = rs.reminder_id AND rs.user_id = ?
      WHERE r.sender_id != ? 
      AND (rs.is_deleted IS NULL OR rs.is_deleted = FALSE)
      AND (
         (r.teacher_id = ?) 
         OR (r.teacher_id IS NULL AND r.department_id = ?)
         OR (r.teacher_id IS NULL AND r.department_id IS NULL AND (
            u.role IN ('RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR')
            OR (SELECT role FROM users WHERE id = ?) NOT IN ('RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR')
         ))
      )
      ORDER BY r.created_at DESC
    `;
    db.query(query, [id, id, id, userDeptId, id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });
};

// Marquer les rappels comme lus pour un utilisateur
exports.markAsRead = (req, res) => {
  const userId = req.user.id;
  const { reminderIds } = req.body; // array of reminder IDs that are currently visible
  
  if (!reminderIds || reminderIds.length === 0) {
    return res.json({ message: "No reminders to mark as read" });
  }

  // Insert or update is_read = TRUE for these reminders
  const values = reminderIds.map(id => [userId, id, true, false]);
  const query = `
    INSERT INTO reminder_status (user_id, reminder_id, is_read, is_deleted) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE is_read = TRUE
  `;
  
  db.query(query, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Reminders marked as read" });
  });
};

// Supprimer (cacher) un rappel spécifique pour un utilisateur
exports.deleteReminder = (req, res) => {
  const userId = req.user.id;
  const reminderId = req.params.id;

  const query = `
    INSERT INTO reminder_status (user_id, reminder_id, is_read, is_deleted) 
    VALUES (?, ?, TRUE, TRUE) 
    ON DUPLICATE KEY UPDATE is_deleted = TRUE
  `;
  
  db.query(query, [userId, reminderId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Reminder deleted" });
  });
};

// Supprimer (cacher) tous les rappels visibles pour un utilisateur
exports.deleteAllReminders = (req, res) => {
  const userId = req.user.id;
  const { reminderIds } = req.body; // array of reminder IDs that are currently visible
  
  if (!reminderIds || reminderIds.length === 0) {
    return res.json({ message: "No reminders to delete" });
  }

  const values = reminderIds.map(id => [userId, id, true, true]);
  const query = `
    INSERT INTO reminder_status (user_id, reminder_id, is_read, is_deleted) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE is_deleted = TRUE
  `;
  
  db.query(query, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "All reminders deleted" });
  });
};
