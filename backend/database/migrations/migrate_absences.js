require('dotenv').config();
const db = require('./config/db');

const query = `
  ALTER TABLE absences 
    ADD COLUMN justification_text TEXT DEFAULT NULL,
    ADD COLUMN catchup_date DATE DEFAULT NULL,
    ADD COLUMN catchup_start_time TIME DEFAULT NULL,
    ADD COLUMN catchup_end_time TIME DEFAULT NULL
`;

db.query(query, (err, res) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping.');
    } else {
      console.error('Error:', err.message);
    }
  } else {
    console.log('Schema updated successfully - added justification_text, catchup_date, catchup_start_time, catchup_end_time to absences table');
  }
  process.exit();
});
