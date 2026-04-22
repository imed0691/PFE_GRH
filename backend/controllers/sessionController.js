const db = require('../config/db');

// Récupérer toutes les séances (avec les détails du prof et du département)
exports.getAllSessions = (req, res) => {
  const query = `
    SELECT s.id, s.module_name, s.session_type, s.day_of_week, s.start_time, s.end_time,
           u.nom as teacher_nom, u.prenom as teacher_prenom,
           d.name as department_name
    FROM academic_sessions s
    JOIN users u ON s.teacher_id = u.id
    JOIN departments d ON s.department_id = d.id
    ORDER BY FIELD(s.day_of_week, 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'), s.start_time ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Créer une nouvelle séance
exports.createSession = (req, res) => {
  const { module_name, session_type, teacher_id, department_id, day_of_week, start_time, end_time } = req.body;
  
  if (!module_name || !session_type || !teacher_id || !department_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  const query = "INSERT INTO academic_sessions (module_name, session_type, teacher_id, department_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)";
  
  db.query(query, [module_name, session_type, teacher_id, department_id, day_of_week, start_time, end_time], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: result.insertId, message: "Séance créée avec succès" });
  });
};

// Supprimer une séance
exports.deleteSession = (req, res) => {
  const sessionId = req.params.id;
  const query = "DELETE FROM academic_sessions WHERE id = ?";
  
  db.query(query, [sessionId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Séance non trouvée" });
    
    res.json({ message: "Séance supprimée avec succès" });
  });
};
