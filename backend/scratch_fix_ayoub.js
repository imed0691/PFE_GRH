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
  // Set Ayoub to TODAY
  db.query("UPDATE users SET created_at = NOW() WHERE nom LIKE '%ayoub%' OR prenom LIKE '%ayoub%' OR email LIKE '%ayoub%'", (err, results) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Successfully updated created_at for Ayoub. Rows affected: ${results.affectedRows}`);
    }
    db.end();
  });
});
