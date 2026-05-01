const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pfe_grh'
});

db.connect();

const query = "SELECT id, teacher_id, department_id, module_name, day_of_week, start_time, end_time, session_date FROM academic_sessions ORDER BY id DESC LIMIT 5";

db.query(query, (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("--- DERNIÈRES SÉANCES CRÉÉES ---");
  console.table(results);
  
  const now = new Date();
  console.log("Heure actuelle serveur:", now.toString());
  console.log("Heure locale metadata:", "2026-05-01 18:43:52");
  
  process.exit(0);
});
