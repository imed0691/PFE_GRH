const db = require('../config/db');

// RH: Créer un rappel
exports.createReminder = (req, res) => {
  const { teacher_id, message, type } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Le message est requis." });
  }

  const query = "INSERT INTO reminders (teacher_id, message, type) VALUES (?, ?, ?)";
  db.query(query, [teacher_id || null, message, type || 'info'], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Rappel envoyé." });
  });
};

// Obtenir les rappels (utilisé par le Teacher Dashboard, déjà partiellement géré dans sessionController, mais on peut le séparer ou le garder centralisé)
exports.getRemindersForTeacher = (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM reminders WHERE teacher_id = ? OR teacher_id IS NULL ORDER BY created_at DESC";
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
