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
  console.log('Connected to DB.');
  
  const query = "ALTER TABLE academic_sessions ADD COLUMN session_date DATE NULL AFTER group_id;";
  db.query(query, (err, result) => {
    if (err) {
      if (err.errno === 1060) {
        console.log('Column already exists.');
      } else {
        console.error('Error adding column:', err);
      }
    } else {
      console.log('Column added successfully.');
    }
    db.end();
  });
});
