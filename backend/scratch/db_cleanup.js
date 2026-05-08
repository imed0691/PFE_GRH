const mysql = require('mysql2/promise');

(async () => {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'pfe_grh_db'
        });

        console.log('--- Démarrage du nettoyage des données de planning ---');

        // Désactiver les contraintes de clés étrangères temporairement pour vider les tables liées
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        const tablesToClear = [
            'academic_sessions',
            'absences',
            'reminders',
            'reminder_status',
            'notifications'
        ];

        for (const table of tablesToClear) {
            try {
                await db.query(`TRUNCATE TABLE ${table}`);
                console.log(`Table ${table} vidée avec succès.`);
            } catch (err) {
                console.warn(`Note: La table ${table} n'existe peut-être pas ou n'a pas pu être vidée.`);
            }
        }

        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('--- Nettoyage terminé ! Vous pouvez recommencer vos tests sur une base propre. ---');
        
        await db.end();
    } catch (error) {
        console.error('Erreur lors du nettoyage :', error);
    }
})();
