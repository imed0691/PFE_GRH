const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pfe_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to DB');
  
  const query = "ALTER TABLE reminders ADD COLUMN department_id INT NULL, ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;";
  
  db.query(query, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('Column already exists');
      } else {
        console.error(err);
      }
    } else {
      console.log('Column department_id added to reminders table');
    }
    db.end();
  });
});
