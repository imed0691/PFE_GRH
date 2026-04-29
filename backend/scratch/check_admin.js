const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Erreur connexion MySQL :', err.message);
    process.exit(1);
  }
  
  db.query("SELECT id, email, role FROM users WHERE email = 'admin@univ.dz'", (err, results) => {
    if (err) {
        console.error('Erreur requête:', err.message);
    } else {
        console.log('Utilisateurs trouvés :', results);
        if (results.length === 0) {
            console.log('--- LE COMPTE N EXISTE PAS ---');
        }
    }
    db.end();
  });
});
