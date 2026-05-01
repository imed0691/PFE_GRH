const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const userId = 23; // Amine's ID
const userRole = 'DEPARTMENT_HEAD';

console.log('--- DEBUG ABSENCES ---');
console.log('User ID:', userId);
console.log('User Role:', userRole);

let query = `
  SELECT a.id, a.date, a.reason, a.status, a.has_justification, a.justification_status, a.is_caught_up, 
         a.justification_text, a.justification_file, a.catchup_date, a.catchup_start_time, a.catchup_end_time,
         a.created_at, a.is_read_by_admin, a.is_read_by_teacher, 
         u.nom, u.prenom, u.department_id 
   FROM absences a
   JOIN users u ON a.teacher_id = u.id
   WHERE 1=1
   ORDER BY a.created_at DESC
`;

db.query(query, (err, results) => {
  if (err) { console.error('Query Error:', err); db.end(); return; }
  console.log('Total absences in DB (all depts):', results.length);

  db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
    if (err) { console.error('Dept Query Error:', err); db.end(); return; }
    if (deptRes.length === 0) { console.log('User not found!'); db.end(); return; }
    
    const headDeptId = deptRes[0].department_id;
    console.log('Head Dept ID:', headDeptId);

    const filtered = results.filter(a => {
        const match = Number(a.department_id) === Number(headDeptId);
        // console.log(`Checking absence ${a.id}: Teacher Dept ${a.department_id} vs Head Dept ${headDeptId} -> Match: ${match}`);
        return match;
    });

    console.log('Filtered Results Count:', filtered.length);
    console.log('Filtered Results (IDs):', filtered.map(a => a.id));
    
    db.end();
  });
});
