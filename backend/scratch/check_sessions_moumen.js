const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect();

const query = "SELECT * FROM academic_sessions WHERE teacher_id = 28";

db.query(query, (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.table(res);
  }
  process.exit(0);
});
