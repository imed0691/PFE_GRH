const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pfe_grh'
});

db.connect();

const query = "SELECT id, teacher_id, module_name, session_type, day_of_week, start_time, session_date, is_extra FROM academic_sessions WHERE is_extra = 1 OR session_date IS NOT NULL";

db.query(query, (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("--- SÉANCES SUPPLÉMENTAIRES OU AVEC DATE ---");
  console.table(results);
  
  const query2 = "SELECT id, teacher_id, date, catchup_date, is_caught_up, is_extra, reason FROM absences WHERE is_caught_up = 1 OR is_extra = 1";
  db.query(query2, (err, results2) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("--- ABSENCES RATTRAPÉES OU SUPP ---");
    console.table(results2);
    process.exit(0);
  });
});
