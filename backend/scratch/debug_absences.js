const mysql = require('mysql2');
require('dotenv').config();
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const teacherId = 27;
const query = `
  SELECT 
    SUM(CASE WHEN is_extra = 0 THEN 1 ELSE 0 END) as reg_unjustified,
    SUM(CASE WHEN is_extra = 1 THEN 1 ELSE 0 END) as extra_unjustified
  FROM absences 
  WHERE teacher_id = ? 
    AND (justification_status IS NULL OR justification_status != 'Accepted')
`;

db.query(query, [teacherId], (err, results) => {
  if (err) console.error(err);
  console.log('Absence Totals for Teacher 27:', results[0]);
  db.end();
});
