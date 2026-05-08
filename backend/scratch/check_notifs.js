const db = require('../config/db');

db.query("SELECT id, teacher_id, is_read_by_teacher, is_cleared, justification_status FROM absences WHERE is_read_by_teacher = 0 AND is_cleared = 0", (err, rows) => {
  if (err) {
    console.error("DB Error:", err);
    process.exit(1);
  }
  console.log("--- UNREAD ABSENCES ---");
  console.table(rows);
  
  db.query("SELECT COUNT(*) as count FROM user_section_views WHERE section_name = 'absences'", (err2, rows2) => {
    if (err2) console.error(err2);
    else console.log("--- ABSENCE VIEWS COUNT ---", rows2[0].count);
    process.exit(0);
  });
});
