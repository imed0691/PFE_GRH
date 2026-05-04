require('dotenv').config();
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const teacherId = 11; // Use the one we saw earlier

const sessionsQuery = "SELECT * FROM academic_sessions WHERE teacher_id = ?";
const statsQuery = "SELECT u.volume_horaire, u.created_at FROM users u WHERE u.id = ?";
const absencesQuery = "SELECT * FROM absences WHERE teacher_id = ?";

db.query(sessionsQuery, [teacherId], (err, sessions) => {
  if (err) { console.error('Sessions Error:', err); process.exit(1); }
  console.log('Sessions found:', sessions.length);
  
  db.query(statsQuery, [teacherId], (err, stats) => {
    if (err) { console.error('Stats Error:', err); process.exit(1); }
    console.log('Stats found:', stats[0]);
    
    db.query(absencesQuery, [teacherId], (err, absences) => {
      if (err) { console.error('Absences Error:', err); process.exit(1); }
      console.log('Absences found:', absences.length);
      console.log('--- TEST SUCCESSFUL ---');
      process.exit(0);
    });
  });
});
