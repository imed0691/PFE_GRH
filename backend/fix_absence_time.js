const mysql = require('mysql2');
const db = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'pfe_grh_db'});

db.query('UPDATE absences SET start_time = "08:00:00", end_time = "09:30:00" WHERE id = 31', (err, results) => {
    if (err) console.error(err);
    else console.log('Absence updated with time.');
    db.end();
});
