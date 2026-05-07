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
  console.log('Connected as id ' + connection.threadId);

  const sql = "ALTER TABLE absences ADD COLUMN catchup_id_missed INT NULL";
  connection.query(sql, (error, results) => {
    if (error) {
      if (error.code === 'ER_DUP_COLUMN_NAME') {
        console.log('Column already exists.');
      } else {
        console.error(error);
      }
    } else {
      console.log('Column catchup_id_missed added successfully.');
    }
    connection.end();
  });
});
