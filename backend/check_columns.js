require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const tables = ['absence_requests', 'academic_sessions'];
  for (const table of tables) {
    try {
      const [rows] = await connection.query(`DESCRIBE ${table}`);
      console.log(`Columns in ${table}:`);
      rows.forEach(row => console.log(row.Field));
    } catch (e) {
      console.log(`Table ${table} not found or error: ${e.message}`);
    }
  }

  await connection.end();
}

checkColumns().catch(console.error);
