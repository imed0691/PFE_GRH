const db = require('../config/db');

// Get all sessions (with teacher and department details)
exports.getAllSessions = (req, res) => {
  const query = `
    SELECT s.id, s.module_name, s.session_type, s.study_level, s.day_of_week, s.start_time, s.end_time, s.section, s.groupe,
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
  const { module_name, session_type, study_level, teacher_id, department_id, day_of_week, start_time, end_time, section, groupe } = req.body;
  
  if (!module_name || !session_type || !study_level || !teacher_id || !department_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const query = "INSERT INTO academic_sessions (module_name, session_type, study_level, teacher_id, department_id, day_of_week, start_time, end_time, section, groupe) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  
  db.query(query, [module_name, session_type, study_level, teacher_id, department_id, day_of_week, start_time, end_time, section || null, groupe || null], (err, result) => {
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

// Get Teacher Dashboard Data (all schedule + stats + reminders)
exports.getTeacherDashboardData = (req, res) => {
  const teacherId = req.params.id;

  // 1. Get ALL sessions for the teacher
  const sessionsQuery = `
    SELECT s.id, s.module_name, s.session_type, s.study_level, s.day_of_week, s.start_time, s.end_time, s.section, s.groupe,
           d.name as department_name
    FROM academic_sessions s
    JOIN departments d ON s.department_id = d.id
    WHERE s.teacher_id = ?
    ORDER BY FIELD(s.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), s.start_time ASC
  `;

  // 2. Get teacher stats (with dynamic unjustified count)
  const statsQuery = `
    SELECT u.volume_horaire, 
           (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND has_justification = FALSE AND is_caught_up = FALSE) as unjustified_count,
           (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND is_caught_up = FALSE) as not_caught_up_count
    FROM users u WHERE u.id = ?
  `;

  // 3. Get reminders
  const remindersQuery = `
    SELECT r.id, r.message as text, r.type, u.nom as sender_nom, u.prenom as sender_prenom, u.role as sender_role,
           COALESCE(rs.is_read, FALSE) as is_read
    FROM reminders r 
    LEFT JOIN users u ON r.sender_id = u.id 
    LEFT JOIN reminder_status rs ON r.id = rs.reminder_id AND rs.user_id = ?
    WHERE (r.teacher_id = ? OR r.teacher_id IS NULL) 
      AND (rs.is_deleted IS NULL OR rs.is_deleted = FALSE)
    ORDER BY r.created_at DESC LIMIT 5
  `;

  // 4. Get absences
  const absencesQuery = "SELECT id, date, reason, status, has_justification, is_caught_up, is_read_by_teacher, justification_text, catchup_date, catchup_start_time, catchup_end_time FROM absences WHERE teacher_id = ? ORDER BY created_at DESC";

  db.query(sessionsQuery, [teacherId], (err, sessions) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(statsQuery, [teacherId], (err, statsResult) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(remindersQuery, [teacherId, teacherId], (err, remindersResult) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(absencesQuery, [teacherId], (err, absencesResult) => {
          if (err) return res.status(500).json({ error: err.message });

          const stats = statsResult[0] || { volume_horaire: 192, unjustified_count: 0, not_caught_up_count: 0 };
          
          // Calcul dynamique des heures assurées
          let completedHours = 0;
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const today = new Date();
          const todayIndex = today.getDay();
          const currentHour = today.getHours() + today.getMinutes() / 60;

          sessions.forEach(s => {
            const sessionDayIndex = daysOfWeek.indexOf(s.day_of_week);
            const [sh, sm] = s.start_time.split(':').map(Number);
            const [eh, em] = s.end_time.split(':').map(Number);
            const duration = (eh + em/60) - (sh + sm/60);

            if (sessionDayIndex < todayIndex) {
              completedHours += duration;
            } else if (sessionDayIndex === todayIndex && (eh + em/60) <= currentHour) {
              completedHours += duration;
            }
          });

          // Soustraire les absences non rattrapées (moyenne de 1.5h par absence)
          completedHours -= (stats.not_caught_up_count * 1.5);
          if (completedHours < 0) completedHours = 0;

          res.json({
            all_sessions: sessions,
            stats: {
              volume_horaire: stats.volume_horaire,
              heures_assurees: Math.round(completedHours * 10) / 10,
              absences: stats.unjustified_count // On affiche les absences qui impactent le salaire
            },
            reminders: remindersResult,
            my_absences: absencesResult
          });
        });
      });
    });
  });
};

// Get modules by department and optionally study level
exports.getModules = (req, res) => {
  const { department_id, study_level } = req.query;
  let query = "SELECT * FROM modules WHERE 1=1";
  const params = [];

  if (department_id) {
    query += " AND department_id = ?";
    params.push(department_id);
  }
  if (study_level) {
    query += " AND study_level = ?";
    params.push(study_level);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
