const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pfe_db'
});

const teacherId = 1; // Assuming ID 1 for now, but we'll try to find the actual teacher
const month = 4; // May
const year = 2026;

const runDebug = async () => {
  // 1. Get Teacher Info
  const [teachers] = await db.promise().query("SELECT id, nom, prenom FROM users WHERE role IN ('TEACHER', 'ENSEIGNANT')");
  console.log('Teachers found:', teachers.map(t => `${t.id}: ${t.nom}`));

  for (const t of teachers) {
    console.log(`\n--- Debugging Teacher ${t.id} (${t.nom}) ---`);
    
    // 2. Get Absences
    const [absences] = await db.promise().query("SELECT * FROM absences WHERE teacher_id = ?", [t.id]);
    console.log('All Absences count:', absences.length);
    
    absences.forEach(a => {
      const aDate = new Date(a.date);
      const m = aDate.getMonth();
      const y = aDate.getFullYear();
      console.log(`Absence ID ${a.id}: Date=${a.date} (M:${m} Y:${y}), is_extra=${a.is_extra}, status=${a.justification_status}, is_caught_up=${a.is_caught_up}`);
    });
  }
  
  db.end();
};

runDebug();
