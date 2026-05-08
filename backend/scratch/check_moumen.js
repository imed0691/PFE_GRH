const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect();

const query = "SELECT id, nom, prenom, email, must_change_password FROM users WHERE nom LIKE '%moumen%' OR prenom LIKE '%moumen%' OR email LIKE '%moumen%'";

db.query(query, (err, res) => {
    if (err) {
        console.error(err);
    } else {
        console.table(res);
    }
    process.exit(0);
});
