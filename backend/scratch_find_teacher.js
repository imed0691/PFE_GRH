const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.query("SELECT id, nom, prenom FROM users WHERE nom = 'ayoub' OR prenom = 'ayoub'", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(results);
  db.end();
});
