const db = require('./config/db');

const query = `
  ALTER TABLE users 
  ADD COLUMN grade VARCHAR(50) DEFAULT 'Teacher',
  ADD COLUMN hourly_rate INT DEFAULT 0,
  ADD COLUMN absence_penalty INT DEFAULT 0,
  ADD COLUMN base_salary INT DEFAULT 0,
  ADD COLUMN extra_hours INT DEFAULT 0;
`;

db.query(query, (error, results) => {
  if (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist.");
    } else {
      console.error("Error altering table:", error);
    }
  } else {
    console.log("Successfully altered users table.");
  }
  process.exit();
});
