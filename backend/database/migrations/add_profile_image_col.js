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
  
  const query = "ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL AFTER must_change_password;";
  db.query(query, (err, result) => {
    if (err) {
      if (err.errno === 1060) {
        console.log('Column profile_image already exists.');
      } else {
        console.error('Error adding column profile_image:', err);
      }
    } else {
      console.log('Column profile_image added successfully.');
    }
    db.end();
  });
});
