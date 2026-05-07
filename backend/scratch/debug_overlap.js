const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect();

const sql = `
  SELECT s.id, s.module_name, s.is_extra, s.day_of_week, s.start_time, u.nom, u.prenom
  FROM academic_sessions s
  JOIN users u ON s.teacher_id = u.id
  WHERE s.is_extra = 1 OR s.module_name LIKE '%Phy%' OR s.module_name LIKE '%Algo%'
`;

connection.query(sql, (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log('--- ACADEMIC SESSIONS (SUPP or Related) ---');
    console.log(JSON.stringify(res, null, 2));
    
    connection.query('SELECT id, teacher_id, catchup_date, catchup_start_time, is_caught_up, reason FROM absences WHERE is_caught_up = 1', (err2, res2) => {
      if (err2) console.error(err2);
      else {
        console.log('--- CATCH-UP SESSIONS ---');
        console.log(JSON.stringify(res2, null, 2));
      }
      connection.end();
    });
  }
});
