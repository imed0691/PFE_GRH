const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pfe_grh_db'
});

const run = async () => {
  try {
    await db.promise().query('DELETE FROM absences');
    console.log('--- DB Cleaned ---');
    
    // 1. On insère une absence "En traitement" (None)
    await db.promise().query("INSERT INTO absences (teacher_id, date, reason, justification_status, created_at) VALUES (1, '2026-05-01', 'Doit rester', 'None', NOW())");
    
    // 2. On insère une absence "Acceptée" (doit être supprimée)
    await db.promise().query("INSERT INTO absences (teacher_id, date, reason, justification_status, created_at) VALUES (1, '2026-05-02', 'Doit partir', 'Accepted', NOW())");
    
    console.log('Inserted 2 absences: one "None" and one "Accepted"');
    
    const [rowsBefore] = await db.promise().query('SELECT * FROM absences');
    console.log('Count before delete:', rowsBefore.length);
    
    // 3. On simule la commande "Clear History"
    console.log('Executing: DELETE FROM absences WHERE justification_status IN ("Accepted", "Rejected")');
    await db.promise().query("DELETE FROM absences WHERE justification_status IN ('Accepted', 'Rejected')");
    
    const [rowsAfter] = await db.promise().query('SELECT * FROM absences');
    console.log('Count after delete:', rowsAfter.length);
    
    if (rowsAfter.length === 1 && rowsAfter[0].justification_status === 'None') {
      console.log('✅ TEST SUCCESS: Only the Accepted absence was deleted. The "None" one is still here.');
    } else {
      console.log('❌ TEST FAILED: Either too many or too few deletions occurred.');
      console.log('Remaining records:', rowsAfter);
    }
  } catch (e) {
    console.error('ERROR DURING TEST:', e);
  } finally {
    db.end();
  }
};

run();
