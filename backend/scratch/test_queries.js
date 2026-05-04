const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pfe_db'
});

const teacherId = 11; // Adjust if needed

const query = `
    SELECT s.*, sl.name as study_level, sec.name as section, sg.name as groupe
    FROM academic_sessions s
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

db.query(query, [teacherId], (err, sessions) => {
  if (err) {
    console.error('ERROR in sessions query:', err.message);
    process.exit(1);
  }
  
  const statsQuery = `
    SELECT u.volume_horaire, u.created_at, 
           (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND is_extra = 0 AND date >= DATE(u.created_at)) as total_reg_absences,
           (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND (justification_status IS NULL OR justification_status != 'Accepted') AND is_extra = 0 AND date >= DATE(u.created_at)) as unjustified_count,
           (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND (justification_status IS NULL OR justification_status != 'Accepted') AND is_extra = 1 AND date >= DATE(u.created_at)) as extra_unjustified_count
    FROM users u WHERE u.id = ?
  `;

  db.query(statsQuery, [teacherId], (err, statsResult) => {
    if (err) {
      console.error('ERROR in stats query:', err.message);
      process.exit(1);
    }
    
    const stats = statsResult[0] || { volume_horaire: 192, total_reg_absences: 0 };
    
    // Simulate the logic in sessionController
    const response = {
      all_sessions: sessions,
      stats: {
        total_absences: stats.total_reg_absences,
        unjustified_absences: stats.unjustified_count,
        extra_unjustified: stats.extra_unjustified_count,
        volume_horaire: stats.volume_horaire
      }
    };
    
    console.log('SIMULATED RESPONSE:', JSON.stringify(response, null, 2));
    db.end();
  });
});
