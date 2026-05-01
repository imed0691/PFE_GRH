const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  // Set everyone to Jan 1st
  db.query("UPDATE users SET created_at = '2026-01-01 00:00:00'", (err, results) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Successfully updated created_at for all users.');
    }
    db.end();
  });
});
