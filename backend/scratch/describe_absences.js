require('dotenv').config();
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
db.query('DESCRIBE absences', (err, results) => {
  if (err) { console.error(err); process.exit(1); }
  results.forEach((r, i) => console.log(`${i}: ${r.Field}`));
  process.exit(0);
});
