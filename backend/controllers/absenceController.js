const db = require('../config/db');

// Chef Département: Marquer une absence
exports.markAbsence = (req, res) => {
  const sender_id = req.user.id;
  const { teacher_id, date, reason, start_time, end_time, is_extra } = req.body;
  
  if (!teacher_id || !date || !reason) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  // Seul le Chef de Département, Admin, RH ou l'Enseignant lui-même peut marquer une absence
  const userRole = req.user.role ? req.user.role.toUpperCase().replace(/[\s-]/g, '_') : '';
  const isSelfReporting = (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') && Number(teacher_id) === Number(sender_id);
  
  const isManager = ['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'RH_MANAGER', 'HR_MANAGER', 'ADMIN', 'RECTOR', 'RECTEUR', 'DEAN', 'DOYEN'].includes(userRole);

  if (!isSelfReporting && !isManager) {
    return res.status(403).json({ message: "Accès refusé. Rôle insuffisant." });
  }

  const query = `
    INSERT INTO absences 
    (teacher_id, date, reason, start_time, end_time, is_extra, status, justification_status, has_justification, is_caught_up, is_read_by_teacher, is_read_by_admin, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, 'Approved', 'None', FALSE, FALSE, FALSE, TRUE, NOW())
  `;
  
  db.query(query, [teacher_id, date, reason, start_time, end_time, is_extra ? 1 : 0], (err, result) => {
    if (err) {
      console.error("Error marking absence:", err);
      return res.status(500).json({ error: err.message });
    }

    // AUTOMATED NOTIFICATION TO TEACHER
    if (!isSelfReporting) {
      const formattedDate = new Date(date).toLocaleDateString();
      const notificationMsg = `Absence signalée le ${formattedDate} : ${reason}`;
      const reminderQuery = "INSERT INTO reminders (teacher_id, sender_id, message, type) VALUES (?, ?, ?, ?)";
      db.query(reminderQuery, [teacher_id, sender_id, notificationMsg, 'warning'], (remErr) => {
        if (remErr) console.error("Error creating automated absence reminder:", remErr);
      });
    }

    res.status(201).json({ message: "Absence enregistrée." });
  });
};

// RH: Voir toutes les absences
exports.getAllAbsences = (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase().replace(/[\s-]/g, '_') : '';
  const userId = req.user.id;

  let query = `
    SELECT a.id, a.date, a.reason, a.status, a.has_justification, a.justification_status, a.is_caught_up, 
           a.justification_text, a.justification_file, a.catchup_date, a.catchup_start_time, a.catchup_end_time,
           a.created_at, a.is_read_by_admin, a.is_read_by_teacher, a.is_extra, a.start_time,
           u.nom, u.prenom, u.department_id 
     FROM absences a
     JOIN users u ON a.teacher_id = u.id
     WHERE a.is_cleared = FALSE
  `;

  if (req.query.filter === 'week') {
    // Show current week OR anything that still needs action OR anything unread by the teacher
    query += ` AND (
      YEARWEEK(DATE_ADD(a.date, INTERVAL 2 DAY), 1) = YEARWEEK(DATE_ADD(CURDATE(), INTERVAL 2 DAY), 1) 
      OR a.justification_status IN ('None', 'Pending')
      ${userRole === 'TEACHER' || userRole === 'ENSEIGNANT' ? 'OR a.is_read_by_teacher = FALSE' : ''}
    )`;
  }

  if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
    query += " AND a.teacher_id = ? ORDER BY a.created_at DESC";
    db.query(query, [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
    return;
  }

  // Managers view (HR, Dept Head, Admin)
  if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
    query += ` AND u.department_id = ${db.escape(req.user.department_id)}`;
  } else if (req.query.department_id && req.query.department_id !== 'all') {
    query += ` AND u.department_id = ${db.escape(req.query.department_id)}`;
  }

  query += " ORDER BY a.created_at DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
      db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
          if (err || deptRes.length === 0) return res.json([]);
          const headDeptId = deptRes[0].department_id;
          // Filter in JS to avoid SQL errors on potentially missing department_id column in absences table
          return res.json(results.filter(a => Number(a.department_id) === Number(headDeptId)));
      });
      return;
    }

    res.json(results);
  });
};

// Dept Head/RH: Mettre à jour Justification ou Rattrapage
exports.updateAbsenceStatus = (req, res) => {
  const { id } = req.params;
  const { status, has_justification, is_caught_up, justification_status } = req.body;
  const adminId = req.user.id;

  let updateFields = [];
  let values = [];

  if (status !== undefined) { updateFields.push("status = ?"); values.push(status); }
  if (has_justification !== undefined) { updateFields.push("has_justification = ?"); values.push(has_justification); }
  if (is_caught_up !== undefined) { updateFields.push("is_caught_up = ?"); values.push(is_caught_up); }
  if (justification_status !== undefined) { updateFields.push("justification_status = ?"); values.push(justification_status); }

  if (updateFields.length === 0) return res.status(400).json({ message: "No fields to update." });

  values.push(id);
  const query = `UPDATE absences SET ${updateFields.join(", ")}, is_read_by_teacher = FALSE WHERE id = ?`;

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Si on a changé le statut de justification, on notifie le prof
    if (justification_status) {
      db.query('SELECT teacher_id, date FROM absences WHERE id = ?', [id], (err, row) => {
        if (!err && row.length > 0) {
          const msg = `Votre justification pour l'absence du ${new Date(row[0].date).toLocaleDateString()} a été ${justification_status === 'Accepted' ? 'ACCEPTÉE' : 'REFUSÉE'}.`;
          db.query('INSERT INTO reminders (teacher_id, sender_id, message, type) VALUES (?, ?, ?, ?)', 
            [row[0].teacher_id, adminId, msg, justification_status === 'Accepted' ? 'info' : 'warning']);
        }
      });
    }

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

    const justificationFile = req.file ? req.file.filename : null;
    const query = `UPDATE absences SET justification_text = ?, justification_file = ?, has_justification = TRUE, justification_status = 'Pending', is_read_by_admin = FALSE WHERE id = ?`;
    db.query(query, [justification_text.trim(), justificationFile, id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Notify Dept Head
      db.query('SELECT u.nom, u.prenom, u.department_id, a.date FROM users u JOIN absences a ON u.id = a.teacher_id WHERE a.id = ?', [id], (err, rows) => {
        if (!err && rows.length > 0) {
          const { nom, prenom, department_id, date } = rows[0];
          const msg = `Nouvelle justification de ${prenom} ${nom} pour l'absence du ${new Date(date).toLocaleDateString()}`;
          db.query('INSERT INTO reminders (department_id, sender_id, message, type) VALUES (?, ?, ?, ?)', 
            [department_id, teacherId, msg, 'info']);
        }
      });

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

      // Notify Dept Head
      db.query('SELECT u.nom, u.prenom, u.department_id, a.date FROM users u JOIN absences a ON u.id = a.teacher_id WHERE a.id = ?', [id], (err, rows) => {
        if (!err && rows.length > 0) {
          const { nom, prenom, department_id, date } = rows[0];
          const msg = `Rattrapage programmé par ${prenom} ${nom} pour l'absence du ${new Date(date).toLocaleDateString()}`;
          db.query('INSERT INTO reminders (department_id, sender_id, message, type) VALUES (?, ?, ?, ?)', 
            [department_id, teacherId, msg, 'info']);
        }
      });

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
// Chef Département/RH/Admin: Supprimer définitivement une absence
exports.deleteAbsence = (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role ? req.user.role.toUpperCase().replace(/[\s-]/g, '_') : '';
  
  const isManager = ['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'RH_MANAGER', 'HR_MANAGER', 'ADMIN'].includes(userRole);
  
  if (!isManager) {
    return res.status(403).json({ message: "Accès refusé. Seul un gestionnaire peut supprimer une absence." });
  }

  // Pour une absence Refusée, on supprime (pour qu'elle remonte dans Recent Sessions)
  // Pour une absence Acceptée, on cache (is_cleared = TRUE) pour qu'elle ne remonte PAS
  db.query('SELECT justification_status FROM absences WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.length === 0) return res.status(404).json({ message: "Absence non trouvée" });

    let query;
    if (row[0].justification_status === 'Accepted') {
      query = "UPDATE absences SET is_cleared = TRUE, is_read_by_teacher = TRUE, is_read_by_admin = TRUE WHERE id = ?";
    } else {
      query = "DELETE FROM absences WHERE id = ?";
    }

    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Absence traitée avec succès." });
    });
  });
};

exports.bulkDeleteAbsences = (req, res) => {
  const userRole = req.user.role ? req.user.role.toUpperCase().replace(/[\s-]/g, '_') : '';
  const isManager = ['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'RH_MANAGER', 'HR_MANAGER', 'ADMIN'].includes(userRole);
  if (!isManager) return res.status(403).json({ message: "Accès refusé." });

  // 1. Supprimer les absences refusées (elles remonteront dans "Recent sessions to mark")
  // 2. Cacher les absences acceptées (elles ne remonteront PAS)
  const deleteRejected = "DELETE FROM absences WHERE justification_status = 'Rejected'";
  const hideAccepted = "UPDATE absences SET is_cleared = TRUE, is_read_by_teacher = TRUE, is_read_by_admin = TRUE WHERE justification_status = 'Accepted' OR is_cleared = TRUE";

  db.query(deleteRejected, (err1, res1) => {
    if (err1) return res.status(500).json({ error: err1.message });
    
    db.query(hideAccepted, (err2, res2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      console.log(`[BulkDelete] Deleted ${res1.affectedRows} rejected, Hid ${res2.affectedRows} accepted.`);
      res.json({ message: "Historique traité nettoyé avec succès." });
    });
  });
};

exports.cancelJustification = (req, res) => {
  const teacherId = req.user.id;
  const { id } = req.params;

  db.query('SELECT * FROM absences WHERE id = ? AND teacher_id = ?', [id, teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Absence non trouvée." });
    
    if (results[0].justification_status === 'Accepted') {
      return res.status(400).json({ message: "Impossible d'annuler une justification déjà acceptée." });
    }

    const query = "UPDATE absences SET justification_text = NULL, justification_file = NULL, has_justification = FALSE, justification_status = 'None' WHERE id = ?";
    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Justification annulée." });
    });
  });
};
