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
  MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending_Dept';
`;

db.query(sql, (err) => {
  if (err) {
    console.error("Error updating promotions table:", err);
  } else {
    console.log("Promotions table updated successfully.");
  }
  process.exit(0);
});
