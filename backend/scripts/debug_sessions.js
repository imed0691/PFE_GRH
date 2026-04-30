const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pfe_grh_db'
});

db.query("SELECT id, module_name, day_of_week, start_time, end_time, session_date, is_extra FROM academic_sessions", (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Current Sessions in DB:");
    console.table(results);
  }
  db.end();
});
