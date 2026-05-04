const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pfe_db'
});

const queries = [
  "ALTER TABLE absences ADD COLUMN IF NOT EXISTS end_time TIME NULL AFTER start_time",
  "ALTER TABLE absences MODIFY COLUMN justification_status ENUM('None', 'Pending', 'Accepted', 'Rejected') DEFAULT 'None'"
];

const runQueries = async () => {
  for (const q of queries) {
    try {
      await db.promise().query(q);
      console.log('SUCCESS:', q);
    } catch (err) {
      console.log('SKIPPED/ERROR:', q, err.message);
    }
  }
  db.end();
};

runQueries();
