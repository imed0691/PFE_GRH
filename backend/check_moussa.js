const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.query("SELECT id, nom, prenom, grade FROM users WHERE prenom LIKE '%moussa%' OR nom LIKE '%moussa%'", (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  process.exit(0);
});
