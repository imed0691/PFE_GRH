const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const sqls = [
  "ALTER TABLE promotions ADD COLUMN file_path VARCHAR(255) AFTER requested_grade",
  "ALTER TABLE promotions MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending_Dept'"
];

const runQueries = async () => {
  for (const sql of sqls) {
    try {
      await new Promise((resolve, reject) => {
        db.query(sql, (err) => {
          if (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
              console.log("Column already exists, skipping...");
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log("Query executed successfully:", sql);
            resolve();
          }
        });
      });
    } catch (err) {
      console.error("Error executing query:", sql, err);
    }
  }
  db.end();
  process.exit(0);
};

runQueries();
