const db = require('../config/db');

// Get all sessions (with teacher and department details)
exports.getAllSessions = (req, res) => {
  const query = `
    SELECT s.id, s.module_name, s.session_type, s.study_level, s.day_of_week, s.start_time, s.end_time,
           u.nom as teacher_nom, u.prenom as teacher_prenom,
           d.name as department_name
    FROM academic_sessions s
    JOIN users u ON s.teacher_id = u.id
    JOIN departments d ON s.department_id = d.id
    ORDER BY FIELD(s.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), s.start_time ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Create a new session
exports.createSession = (req, res) => {
  const { module_name, session_type, study_level, teacher_id, department_id, day_of_week, start_time, end_time } = req.body;
  
  if (!module_name || !session_type || !study_level || !teacher_id || !department_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const query = "INSERT INTO academic_sessions (module_name, session_type, study_level, teacher_id, department_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  
  db.query(query, [module_name, session_type, study_level, teacher_id, department_id, day_of_week, start_time, end_time], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: result.insertId, message: "Session created successfully" });
  });
};

// Delete a session
exports.deleteSession = (req, res) => {
  const sessionId = req.params.id;
  const query = "DELETE FROM academic_sessions WHERE id = ?";
  
  db.query(query, [sessionId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Session not found" });
    
    res.json({ message: "Session deleted successfully" });
  });
};
