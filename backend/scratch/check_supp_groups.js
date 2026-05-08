const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pfe_grh'
});

db.connect();

const query = `
    SELECT s.id, s.module_name, s.session_type, s.day_of_week, s.start_time, s.session_date, s.is_extra,
           sec.name as section, sg.name as groupe
    FROM academic_sessions s
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN student_groups sg ON s.group_id = sg.id
    WHERE s.id IN (120, 124)
`;

db.query(query, (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.table(results);
  process.exit(0);
});
