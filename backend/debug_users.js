const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.query("SELECT email, password FROM users WHERE email LIKE '%univ.dz' LIMIT 5", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Users found:");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
