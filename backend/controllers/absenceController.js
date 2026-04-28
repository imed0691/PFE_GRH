const db = require('../config/db');

// Chef Département: Marquer une absence
exports.markAbsence = (req, res) => {
  const sender_id = req.user.id;
  const { teacher_id, date, reason } = req.body;
  
  if (!teacher_id || !date || !reason) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  // Seul le Chef de Département ou Admin peut marquer une absence
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  if (userRole !== 'DEPARTMENT_HEAD' && userRole !== 'CHEF_DEPARTEMENT' && userRole !== 'RH_MANAGER' && userRole !== 'HR_MANAGER' && userRole !== 'ADMIN') {
    return res.status(403).json({ message: "Accès refusé." });
  }

  const query = "INSERT INTO absences (teacher_id, date, reason, status, is_read_by_teacher) VALUES (?, ?, ?, 'Approved', FALSE)";
  db.query(query, [teacher_id, date, reason], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Absence enregistrée." });
  });
};

// RH: Voir toutes les absences
exports.getAllAbsences = (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  const userId = req.user.id;

  const query = `
    SELECT a.id, a.date, a.reason, a.status, a.has_justification, a.is_caught_up, 
           a.justification_text, a.catchup_date, a.catchup_start_time, a.catchup_end_time,
           a.created_at, a.is_read_by_admin, a.is_read_by_teacher, 
           u.nom, u.prenom, u.department_id 
    FROM absences a
    JOIN users u ON a.teacher_id = u.id
    ORDER BY a.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
      db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
          if (err || deptRes.length === 0) return res.json([]);
          const headDeptId = deptRes[0].department_id;
          return res.json(results.filter(a => a.department_id === headDeptId));
      });
      return;
    }

    res.json(results);
  });
};

// Dept Head/RH: Mettre à jour Justification ou Rattrapage
exports.updateAbsenceStatus = (req, res) => {
  const { id } = req.params;
  const { status, has_justification, is_caught_up } = req.body;

  let updateFields = [];
  let values = [];

  if (status !== undefined) { updateFields.push("status = ?"); values.push(status); }
  if (has_justification !== undefined) { updateFields.push("has_justification = ?"); values.push(has_justification); }
  if (is_caught_up !== undefined) { updateFields.push("is_caught_up = ?"); values.push(is_caught_up); }

  if (updateFields.length === 0) return res.status(400).json({ message: "No fields to update." });

  values.push(id);
  const query = `UPDATE absences SET ${updateFields.join(", ")}, is_read_by_teacher = FALSE WHERE id = ?`;

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Absence mise à jour avec succès." });
  });
};

// Enseignant: Soumettre une justification pour une absence
exports.submitJustification = (req, res) => {
  const teacherId = req.user.id;
  const { id } = req.params;
  const { justification_text } = req.body;

  if (!justification_text || justification_text.trim() === '') {
    return res.status(400).json({ message: "La justification est requise." });
  }

  // Vérifier que l'absence appartient bien à cet enseignant
  db.query('SELECT * FROM absences WHERE id = ? AND teacher_id = ?', [id, teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Absence non trouvée." });

    const query = `UPDATE absences SET justification_text = ?, has_justification = TRUE, is_read_by_admin = FALSE WHERE id = ?`;
    db.query(query, [justification_text.trim(), id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Justification envoyée avec succès." });
    });
  });
};

// Enseignant: Programmer un rattrapage pour une absence
exports.submitCatchup = (req, res) => {
  const teacherId = req.user.id;
  const { id } = req.params;
  const { catchup_date, catchup_start_time, catchup_end_time } = req.body;

  if (!catchup_date || !catchup_start_time || !catchup_end_time) {
    return res.status(400).json({ message: "Tous les champs de rattrapage sont requis." });
  }

  // Vérifier que l'absence appartient bien à cet enseignant
  db.query('SELECT * FROM absences WHERE id = ? AND teacher_id = ?', [id, teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Absence non trouvée." });

    const query = `UPDATE absences SET catchup_date = ?, catchup_start_time = ?, catchup_end_time = ?, is_caught_up = TRUE, is_read_by_admin = FALSE WHERE id = ?`;
    db.query(query, [catchup_date, catchup_start_time, catchup_end_time, id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Rattrapage programmé avec succès." });
    });
  });
};

// Admin: Marquer toutes les absences comme lues
exports.markAsReadAdmin = (req, res) => {
  const query = "UPDATE absences SET is_read_by_admin = TRUE WHERE is_read_by_admin = FALSE";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Absences marquées comme lues par l'admin" });
  });
};

// Teacher: Marquer toutes ses absences comme lues
exports.markAsReadTeacher = (req, res) => {
  const teacherId = req.user.id;
  const query = "UPDATE absences SET is_read_by_teacher = TRUE WHERE teacher_id = ? AND is_read_by_teacher = FALSE";
  db.query(query, [teacherId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Absences marquées comme lues par l'enseignant" });
  });
};
