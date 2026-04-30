const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pfe_db'
  });

  const [rows] = await connection.query("SELECT id, nom, prenom, role FROM users WHERE role IN ('TEACHER', 'ENSEIGNANT') LIMIT 5");
  console.log("Teacher users:");
  console.table(rows);

  await connection.end();
}

checkUsers().catch(console.error);
