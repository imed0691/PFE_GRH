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

  const sql = "UPDATE absences SET catchup_date = NULL, catchup_start_time = NULL, catchup_end_time = NULL, is_caught_up = FALSE WHERE catchup_start_time LIKE '08:00%' AND is_caught_up = TRUE";
  connection.query(sql, (error, results) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Successfully removed ${results.affectedRows} conflicting catch-up session(s).`);
    }
    connection.end();
  });
});
