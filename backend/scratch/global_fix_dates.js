const mysql = require('mysql2/promise');

(async () => {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'pfe_grh_db'
    });
    
    await db.query('UPDATE users SET created_at = "2025-01-01 09:00:00"');
    console.log('Mise à jour terminée : Tous les utilisateurs sont recrutés depuis le 01/01/2025.');
    
    await db.end();
})();
