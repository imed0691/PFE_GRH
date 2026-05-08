const mysql = require('mysql2/promise');

(async () => {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'pfe_grh_db'
        });

        const [rows] = await db.query('SELECT * FROM academic_sessions WHERE teacher_id = 22');
        console.log(JSON.stringify(rows, null, 2));
        
        await db.end();
    } catch (error) {
        console.error(error);
    }
})();
