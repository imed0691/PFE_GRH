const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pfe_grh'
});

db.connect();

const query = "SELECT id, module_name, session_type, day_of_week, start_time, session_date, is_extra FROM academic_sessions WHERE teacher_id = 22";

db.query(query, (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("--- TOUTES LES SÉANCES DU PROF 22 ---");
  console.table(results);
  process.exit(0);
});
