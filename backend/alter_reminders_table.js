require('dotenv').config();
const db = require('./config/db');

const query = `
  ALTER TABLE reminders 
  ADD COLUMN sender_id INT NULL,
  ADD CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
`;

db.query(query, (error, results) => {
  if (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error altering table:", error);
    }
  } else {
    console.log("Successfully altered reminders table.");
  }
  process.exit();
});
