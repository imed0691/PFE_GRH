const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const sql = `
  ALTER TABLE promotions 
  ADD COLUMN file_path VARCHAR(255) AFTER requested_grade;
`;

db.query(sql, (err) => {
  if (err) {
    console.error("Error updating promotions table (file_path):", err);
  } else {
    console.log("Promotions table updated with file_path.");
  }
  process.exit(0);
});
