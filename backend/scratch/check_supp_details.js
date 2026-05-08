const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pfe_grh'
});

db.connect();

const query = "SELECT id, teacher_id, module_name, session_type, day_of_week, start_time, session_date, is_extra, created_at FROM academic_sessions WHERE id IN (120, 124)";

db.query(query, (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("--- DETAILS SÉANCES 120 & 124 ---");
  console.table(results);
  process.exit(0);
});
