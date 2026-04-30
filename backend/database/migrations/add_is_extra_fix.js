const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'PFE_GRH'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting:', err);
    process.exit(1);
  }
  
  const query = "ALTER TABLE academic_sessions ADD COLUMN is_extra BOOLEAN DEFAULT FALSE AFTER group_id;";
  db.query(query, (err, result) => {
    if (err) {
      if (err.errno === 1060) {
        console.log('Column is_extra already exists.');
      } else {
        console.error('Error adding column is_extra:', err);
      }
    } else {
      console.log('Column is_extra added successfully.');
    }
    db.end();
  });
});
