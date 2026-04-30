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
  
  db.query("DESCRIBE academic_sessions", (err, result) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Columns in academic_sessions:', result.map(c => c.Field));
    }
    db.end();
  });
});
