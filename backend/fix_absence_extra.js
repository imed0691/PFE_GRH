const mysql = require('mysql2');
const db = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'pfe_grh_db'});

db.query('UPDATE absences SET is_extra = 1 WHERE id = 33', (err, results) => {
    if (err) console.error(err);
    else console.log('Absence 33 updated to is_extra = 1.');
    db.end();
});
