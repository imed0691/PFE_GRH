const db = require('../config/db');

// Chef Département: Marquer une absence
exports.markAbsence = (req, res) => {
  const sender_id = req.user.id;
  const { teacher_id, date, reason, start_time, end_time, is_extra, catchup_id_missed } = req.body;
  
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
    (teacher_id, date, reason, start_time, end_time, is_extra, catchup_id_missed, status, justification_status, has_justification, is_caught_up, is_read_by_teacher, is_read_by_admin, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved', ?, FALSE, FALSE, FALSE, TRUE, NOW())
  `;
  
  const justStatus = catchup_id_missed ? 'Rejected' : 'None';

  db.query(query, [teacher_id, date, reason, start_time, end_time, is_extra ? 1 : 0, catchup_id_missed || null, justStatus], (err, result) => {
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
    SELECT a.id, a.teacher_id, a.date, a.reason, a.status, a.has_justification, a.justification_status, a.is_caught_up, 
           a.justification_text, a.justification_file, a.catchup_date, a.catchup_start_time, a.catchup_end_time,
           a.created_at, a.is_read_by_admin, a.is_read_by_teacher, a.is_extra, a.start_time, a.catchup_id_missed,
           u.nom, u.prenom, u.department_id 
     FROM absences a
     JOIN users u ON a.teacher_id = u.id
     WHERE a.is_cleared = FALSE AND a.is_extra = FALSE AND a.date <= CURDATE()
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
    // Automatically mark all as read when the teacher fetches their list
    db.query("UPDATE absences SET is_read_by_teacher = TRUE WHERE teacher_id = ?", [userId]);
    
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
  const { status, has_justification, is_caught_up, justification_status, catchup_date, catchup_start_time, catchup_end_time } = req.body;
  const adminId = req.user.id;

  let updateFields = [];
  let values = [];

  if (status !== undefined) { updateFields.push("status = ?"); values.push(status); }
  if (has_justification !== undefined) { updateFields.push("has_justification = ?"); values.push(has_justification); }
  if (is_caught_up !== undefined) { updateFields.push("is_caught_up = ?"); values.push(is_caught_up); }
  if (justification_status !== undefined) { updateFields.push("justification_status = ?"); values.push(justification_status); }
  
  if (catchup_date !== undefined) { updateFields.push("catchup_date = ?"); values.push(catchup_date); }
  if (catchup_start_time !== undefined) { updateFields.push("catchup_start_time = ?"); values.push(catchup_start_time); }
  if (catchup_end_time !== undefined) { updateFields.push("catchup_end_time = ?"); values.push(catchup_end_time); }
  
  if (catchup_date && catchup_start_time) {
    updateFields.push("is_caught_up = TRUE");
  }

  if (updateFields.length === 0) return res.status(400).json({ message: "No fields to update." });

  const performUpdate = () => {
    const finalValues = [...values, id];
    const query = `UPDATE absences SET ${updateFields.join(", ")}, is_read_by_teacher = FALSE WHERE id = ?`;

    db.query(query, finalValues, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Notification logic
      db.query('SELECT teacher_id, date FROM absences WHERE id = ?', [id], (err, rows) => {
        if (err || rows.length === 0) return;
        const teacher_id = rows[0].teacher_id;
        const absDate = new Date(rows[0].date).toLocaleDateString();
        
        let msg = "";
        if (justification_status === 'Accepted') msg = `Justification acceptée pour l'absence du ${absDate}.`;
        else if (justification_status === 'Rejected') msg = `Justification refusée pour l'absence du ${absDate}.`;
        else if (catchup_date === null && is_caught_up === false) msg = `Rattrapage annulé pour l'absence du ${absDate}.`;
        else if (catchup_date && catchup_start_time) {
          msg = `Rattrapage programmé le ${new Date(catchup_date).toLocaleDateString()} à ${catchup_start_time.substring(0,5)}.`;
        }

        if (msg) {
          db.query('INSERT INTO reminders (teacher_id, sender_id, message, type) VALUES (?, ?, ?, ?)', 
            [teacher_id, adminId, msg, 'info']);
        }
      });

      res.json({ message: "Absence mise à jour avec succès.", id });
    });
  };

  // --- CONFLICT DETECTION ---
  if (catchup_date && catchup_start_time) {
    db.query('SELECT teacher_id FROM absences WHERE id = ?', [id], (err, rows) => {
      if (err || rows.length === 0) return res.status(404).json({ message: "Absence non trouvée" });
      const tId = rows[0].teacher_id;
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[new Date(catchup_date).getDay()];

      // Check regular/supp sessions
      const checkReg = `
        SELECT module_name FROM academic_sessions 
        WHERE teacher_id = ? AND day_of_week = ? AND TIME(start_time) = TIME(?)
        AND (session_date IS NULL OR DATE(session_date) = DATE(?))
      `;
      db.query(checkReg, [tId, day, catchup_start_time, catchup_date], (err, regs) => {
        if (err) return res.status(500).json({ error: err.message });
        if (regs.length > 0) {
          return res.status(409).json({ message: `CONFLIT : L'enseignant a déjà une séance (${regs[0].module_name}) à ce créneau.` });
        }

        // Check other catch-ups
        const checkCatch = `
          SELECT reason FROM absences 
          WHERE teacher_id = ? AND DATE(catchup_date) = DATE(?) AND TIME(catchup_start_time) = TIME(?)
          AND id != ? AND is_caught_up = TRUE
        `;
        db.query(checkCatch, [tId, catchup_date, catchup_start_time, id], (err, catches) => {
          if (err) return res.status(500).json({ error: err.message });
          if (catches.length > 0) {
            return res.status(409).json({ message: `CONFLIT : Un autre rattrapage est déjà prévu à ce créneau.` });
          }

          performUpdate();
        });
      });
    });
  } else {
    performUpdate();
  }
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
    
    if (results[0].catchup_id_missed) {
      return res.status(403).json({ message: "Impossible de justifier une absence à une séance de rattrapage." });
    }

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

    if (results[0].catchup_id_missed) {
      return res.status(403).json({ message: "On ne peut pas rattraper un rattrapage manqué." });
    }

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
