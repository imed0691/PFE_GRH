const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.query('SELECT id, module_name, is_extra, session_date, start_time, end_time FROM academic_sessions WHERE teacher_id = 27', (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('--- SESSIONS FOR TEACHER 27 ---');
  results.forEach(s => {
    console.log(`ID: ${s.id}, Module: ${s.module_name}, Extra: ${s.is_extra} (${typeof s.is_extra}), Date: ${s.session_date}, Start: ${s.start_time}`);
  });
  
  db.query('SELECT * FROM users WHERE id = 27', (err, users) => {
      console.log('--- TEACHER 27 STATS ---');
      console.log(users[0]);
      db.end();
  });
});
