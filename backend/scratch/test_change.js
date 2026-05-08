const mysql = require('mysql2/promise');

(async () => {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'pfe_grh_db'
    });
    
    console.log('1. Arrêt du cours du matin (ID 2) le 8 Mai...');
    await db.query('UPDATE academic_sessions SET end_date = "2026-05-08" WHERE id = 2');
    
    console.log('2. Création du cours du soir (18h00) le 8 Mai...');
    await db.query('INSERT INTO academic_sessions (module_name, session_type, study_level_id, teacher_id, department_id, day_of_week, start_time, end_time, section_id, is_extra, created_at) VALUES ("Algo 1 (SOIR)", "Lecture", 2, 22, 1, "Saturday", "18:00:00", "19:30:00", 1, 0, "2026-05-08 17:15:00")');
    
    console.log('Test effectué !');
    await db.end();
})();
