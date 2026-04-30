require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await connection.query("SHOW TABLES");
  console.log("Tables in database:");
  rows.forEach(row => console.log(Object.values(row)[0]));

  await connection.end();
}

checkTables().catch(console.error);
