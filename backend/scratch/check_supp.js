const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect();

connection.query('SELECT id, module_name, is_extra, session_date, start_time, day_of_week FROM academic_sessions WHERE is_extra = 1', (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(res, null, 2));
  }
  connection.end();
});
