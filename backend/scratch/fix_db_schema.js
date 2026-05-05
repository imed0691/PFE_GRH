require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const queries = [
  "ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  "ALTER TABLE absences ADD COLUMN is_extra TINYINT(1) DEFAULT 0",
  "ALTER TABLE absences ADD COLUMN start_time TIME NULL",
  "ALTER TABLE promotions ADD COLUMN evaluation_score INT DEFAULT 0"
];

const runQueries = async () => {
  for (const q of queries) {
    try {
      await new Promise((resolve, reject) => {
        db.query(q, (err) => {
          if (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
              console.log(`Column already exists, skipping: ${q}`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`Success: ${q}`);
            resolve();
          }
        });
      });
    } catch (err) {
      console.error(`Error running query "${q}":`, err.message);
    }
  }
  process.exit(0);
};

runQueries();
