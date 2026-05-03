const mysql = require('mysql2');
const db = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'pfe_grh_db'});

db.query('SELECT id, nom, prenom FROM users', (err, results) => {
    if (err) {
        console.error(err);
    } else {
        const found = results.filter(u => 
            (u.nom && u.nom.toLowerCase().includes('ayoub')) || 
            (u.prenom && u.prenom.toLowerCase().includes('ayoub'))
        );
        console.log(JSON.stringify(found, null, 2));
    }
    db.end();
});
