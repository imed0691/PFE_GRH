const db = require('../config/db');

// Get all sessions (with teacher and department details)
exports.getAllSessions = (req, res) => {
  const query = `
    SELECT s.id, s.module_name, s.session_type, s.day_of_week, s.start_time, s.end_time, 
           sl.name as study_level, sec.name as section, sg.name as groupe,
           u.nom as teacher_nom, u.prenom as teacher_prenom,
           d.name as department_name
    FROM academic_sessions s
    JOIN users u ON s.teacher_id = u.id
    JOIN departments d ON s.department_id = d.id
    JOIN study_levels sl ON s.study_level_id = sl.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN student_groups sg ON s.group_id = sg.id
    ORDER BY FIELD(s.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), s.start_time ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Create a new session
exports.createSession = (req, res) => {
  const { module_name, session_type, study_level_id, teacher_id, department_id, day_of_week, start_time, end_time, section_id, group_id, is_extra, session_date } = req.body;
  
  if (!module_name || !session_type || !study_level_id || !teacher_id || !department_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // --- CONFLICT DETECTION LOGIC (TOTAL LOCKDOWN) ---
  const tId = Number(teacher_id);
  const sDate = session_date ? session_date : null;

  console.log(`[LOCKDOWN] Checking: Prof:${tId}, Day:${day_of_week}, Time:${start_time}`);

  // Query to find ANY session that blocks this slot for this teacher
  const conflictQuery = `
    SELECT id, module_name FROM academic_sessions 
    WHERE teacher_id = ? 
      AND day_of_week = ? 
      AND TIME(start_time) = TIME(?)
      AND (
        (session_date IS NULL)           -- Existing is recurring (blocks all)
        OR (DATE(session_date) = DATE(?)) -- Existing is same date
        OR (? IS NULL)                    -- New is recurring (blocks all existing on that day)
      )
  `;

  db.query(conflictQuery, [tId, day_of_week, start_time, sDate, sDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      console.log(`[LOCKDOWN] REJECTED: Conflict with ${results[0].module_name}`);
      return res.status(409).json({ 
        message: `ARRÊT CRITIQUE : Ce créneau (${day_of_week} à ${start_time}) est DÉJÀ RÉSERVÉ pour ce professeur (Cours: ${results[0].module_name}).` 
      });
    }

    const query = "INSERT INTO academic_sessions (module_name, session_type, study_level_id, teacher_id, department_id, day_of_week, start_time, end_time, section_id, group_id, is_extra, session_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(query, [module_name, session_type, study_level_id, tId, department_id, day_of_week, start_time, end_time, section_id || null, group_id || null, is_extra || false, sDate], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // Notification logic
      const sender_id = req.user ? req.user.id : null;
      const dateStr = sDate ? new Date(sDate).toLocaleDateString() : day_of_week;
      const timeStr = `${start_time.substring(0, 5)} - ${end_time.substring(0, 5)}`;
      const sessionTypeLabel = session_type === 'Lecture' ? 'COURS' : (session_type === 'Tutorial' ? 'TD' : 'TP');
      
      const notificationMessage = `Nouvelle séance : ${module_name} (${sessionTypeLabel}) le ${dateStr} à ${timeStr}.`;
      
      const reminderQuery = "INSERT INTO reminders (teacher_id, sender_id, message, type) VALUES (?, ?, ?, ?)";
      db.query(reminderQuery, [tId, sender_id, notificationMessage, 'info'], (remErr) => {
        if (remErr) console.error("Error creating automated reminder:", remErr);
      });

      res.status(201).json({ id: result.insertId, message: "Séance créée avec succès" });
    });
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
  console.log('--- ENTERING getTeacherDashboardData --- ID:', req.params.id);
  const teacherId = req.params.id;

  // 1. Get ALL sessions for the teacher
  const sessionsQuery = `
    SELECT s.id, s.module_name, s.session_type, s.day_of_week, s.start_time, s.end_time, s.is_extra, s.session_date,
           sl.name as study_level, sec.name as section, sg.name as groupe,
           d.name as department_name
    FROM academic_sessions s
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN study_levels sl ON s.study_level_id = sl.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN student_groups sg ON s.group_id = sg.id
    WHERE s.teacher_id = ?
    ORDER BY 
      s.is_extra ASC,
      FIELD(s.day_of_week, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), 
      s.start_time ASC,
      s.session_date ASC
  `;

  // 2. Get teacher stats (absences and target volume)
  const statsQuery = `
    SELECT u.volume_horaire, 
           (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id) as total_absences,
           (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND (justification_status IS NULL OR justification_status != 'Accepted')) as unjustified_count
    FROM users u WHERE u.id = ?
  `;

  // 3. Get reminders
  const remindersQuery = `
    SELECT r.id, r.message as text, r.type, u.nom as sender_nom, u.prenom as sender_prenom, u.role as sender_role,
           COALESCE(rs.is_read, FALSE) as is_read
    FROM reminders r 
    LEFT JOIN users u ON r.sender_id = u.id 
    LEFT JOIN reminder_status rs ON r.id = rs.reminder_id AND rs.user_id = ?
    WHERE r.sender_id != ? AND (r.teacher_id = ? 
       OR (r.teacher_id IS NULL AND r.department_id = (SELECT department_id FROM users WHERE id = ?))
       OR (r.teacher_id IS NULL AND r.department_id IS NULL AND (
            u.role IN ('RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR')
            OR (SELECT role FROM users WHERE id = ?) NOT IN ('RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR')
       ))
    )
      AND (rs.is_deleted IS NULL OR rs.is_deleted = FALSE)
    ORDER BY r.created_at DESC LIMIT 5
  `;

  // 4. Get absences
  const absencesQuery = "SELECT id, date, reason, status, has_justification, justification_status, justification_file, is_caught_up, is_read_by_teacher, justification_text, catchup_date, catchup_start_time, catchup_end_time FROM absences WHERE teacher_id = ? ORDER BY created_at DESC";

  db.query(sessionsQuery, [teacherId], (err, sessions) => {
    if (err) return res.status(500).json({ error: err.message });

    // Calculate session stats immediately
    const totalSessions = sessions.length;
    const extraSessionsCount = sessions.filter(s => s.is_extra).length;
    
    let completedSessionsCount = 0;
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const todayIndex = today.getDay();
    const currentHour = today.getHours() + today.getMinutes() / 60;

    sessions.forEach(s => {
      const [eh, em] = s.end_time.split(':').map(Number);
      const sessionEndHour = eh + em/60;

      if (s.session_date) {
        const sDate = new Date(s.session_date);
        const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const sessionDateNoTime = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());

        if (sessionDateNoTime < todayNoTime) {
          completedSessionsCount++;
        } else if (sessionDateNoTime.getTime() === todayNoTime.getTime() && sessionEndHour <= currentHour) {
          completedSessionsCount++;
        }
      } else {
        const sessionDayIndex = daysOfWeek.indexOf(s.day_of_week);
        if (sessionDayIndex < todayIndex) {
          completedSessionsCount++;
        } else if (sessionDayIndex === todayIndex && sessionEndHour <= currentHour) {
          completedSessionsCount++;
        }
      }
    });

    db.query(statsQuery, [teacherId], (err, statsResult) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(remindersQuery, [teacherId, teacherId, teacherId, teacherId, teacherId], (err, remindersResult) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(absencesQuery, [teacherId], (err, absencesResult) => {
          if (err) return res.status(500).json({ error: err.message });

          const teacherStats = statsResult[0] || { total_absences: 0 };
          let actualDone = completedSessionsCount - (teacherStats.total_absences || 0);
          if (actualDone < 0) actualDone = 0;

          const sessionsToDo = sessions.length - actualDone;
          const dashboardStats = {
            total_weekly_sessions: sessionsToDo < 0 ? 0 : sessionsToDo,
            extra_sessions: sessions.filter(s => s.is_extra).length,
            completed_sessions: actualDone,
            absences: teacherStats.total_absences || 0
          };

          console.log('[BACKEND DEBUG] Sending Stats:', dashboardStats);

          res.json({
            all_sessions: sessions,
            academic_stats: dashboardStats,
            reminders: remindersResult,
            my_absences: absencesResult
          });
        });
      });
    });
  });
};

// Get modules by department and optionally study level ID
exports.getModules = (req, res) => {
  const { department_id, study_level_id } = req.query;
  let query = "SELECT * FROM modules WHERE 1=1";
  const params = [];

  if (department_id) {
    query += " AND department_id = ?";
    params.push(department_id);
  }
  if (study_level_id) {
    query += " AND study_level_id = ?";
    params.push(study_level_id);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
