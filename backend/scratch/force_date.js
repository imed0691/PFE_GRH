const mysql = require('mysql2/promise');

(async () => {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'pfe_grh_db'
    });
    
    // Force date for Moumen (ID 28) and Gio (ID 22) to Jan 1st 2026
    await db.query('UPDATE users SET created_at = "2026-01-01 10:00:00" WHERE id IN (22, 28)');
    
    const [rows] = await db.query('SELECT id, nom, created_at FROM users WHERE id IN (22, 28)');
    console.log('VÉRIFICATION FINALE :');
    console.log(JSON.stringify(rows, null, 2));
    
    await db.end();
})();
