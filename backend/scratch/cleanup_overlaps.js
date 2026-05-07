const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect();

// Delete SUPP sessions that overlap with scheduled catch-ups
const sql = `
  DELETE s FROM academic_sessions s
  JOIN absences a ON s.teacher_id = a.teacher_id 
    AND s.day_of_week = DAYNAME(a.catchup_date)
    AND TIME(s.start_time) = TIME(a.catchup_start_time)
  WHERE s.is_extra = 1 AND a.is_caught_up = 1
`;

connection.query(sql, (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Successfully removed ${res.affectedRows} overlapping SUPP sessions.`);
  }
  connection.end();
});
