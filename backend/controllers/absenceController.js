const db = require('../config/db');

// Enseignant: Signaler une absence
exports.reportAbsence = (req, res) => {
  const teacher_id = req.user.id;
  const { date, reason } = req.body;
  
  if (!date || !reason) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  const query = "INSERT INTO absence_requests (teacher_id, date, reason) VALUES (?, ?, ?)";
  db.query(query, [teacher_id, date, reason], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Demande d'absence envoyée." });
  });
};

// RH: Voir toutes les absences
exports.getAllAbsences = (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  const userId = req.user.id;

  const query = `
    SELECT a.id, a.date, a.reason, a.status, a.created_at, a.is_read_by_admin, a.is_read_by_teacher, u.nom, u.prenom, u.department_id 
    FROM absence_requests a
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

// RH/Dept Head: Mettre à jour le statut
exports.updateAbsenceStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Recommended', 'Approved' ou 'Rejected'

  if (status !== 'Recommended' && status !== 'Approved' && status !== 'Rejected') {
    return res.status(400).json({ message: "Statut invalide." });
  }

  // Mettre à jour le statut de l'absence et la marquer comme non lue par l'enseignant
  db.query("UPDATE absence_requests SET status = ?, is_read_by_teacher = FALSE WHERE id = ?", [status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Si approuvée, incrémenter le nombre d'absences de l'enseignant
    if (status === 'Approved') {
      db.query("SELECT teacher_id FROM absence_requests WHERE id = ?", [id], (err, absRes) => {
        if (!err && absRes.length > 0) {
          db.query("UPDATE users SET absences = absences + 1 WHERE id = ?", [absRes[0].teacher_id]);
        }
      });
    }

    res.json({ message: `Absence status updated to ${status}` });
  });
};

// Admin: Marquer toutes les absences comme lues
exports.markAsReadAdmin = (req, res) => {
  const query = "UPDATE absence_requests SET is_read_by_admin = TRUE WHERE is_read_by_admin = FALSE";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Absences marquées comme lues par l'admin" });
  });
};

// Teacher: Marquer toutes ses absences comme lues
exports.markAsReadTeacher = (req, res) => {
  const teacherId = req.user.id;
  const query = "UPDATE absence_requests SET is_read_by_teacher = TRUE WHERE teacher_id = ? AND is_read_by_teacher = FALSE";
  db.query(query, [teacherId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Absences marquées comme lues par l'enseignant" });
  });
};
