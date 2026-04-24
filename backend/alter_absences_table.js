require('dotenv').config();
const db = require('./config/db');

const query = `
  ALTER TABLE absence_requests 
  ADD COLUMN is_read_by_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_read_by_teacher BOOLEAN DEFAULT TRUE;
`;

db.query(query, (error, results) => {
  if (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist.");
    } else {
      console.error("Error altering table:", error);
    }
  } else {
    console.log("Successfully altered absence_requests table.");
  }
  process.exit();
});
