const mysql = require('mysql2');
const db = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'pfe_grh_db'});

db.query('SELECT id, DATE_FORMAT(date, "%Y-%m-%d") as date_str, start_time, is_extra FROM absences WHERE teacher_id = 27', (err, results) => {
    if (err) console.error(err);
    else console.log(results);
    db.end();
});
