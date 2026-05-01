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
  db.query('SELECT * FROM academic_sessions', (err, results) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Total sessions in table: ${results.length}`);
      console.log(JSON.stringify(results, null, 2));
    }
    db.end();
  });
});
