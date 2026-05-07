const mysql = require('mysql2');
require('dotenv').config({ path: './backend/.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  
  const sql = "DELETE FROM absences WHERE is_extra = 1";
  connection.query(sql, (error, results) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Successfully deleted ${results.affectedRows} existing absence record(s) for extra sessions (SUPP).`);
    }
    connection.end();
  });
});
