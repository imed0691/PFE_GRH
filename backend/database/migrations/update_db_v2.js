require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected to database.');

  const sql = "ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE";
  
  connection.query(sql, (error, results) => {
    if (error) {
      if (error.code === 'ER_DUP_COLUMN_NAME') {
        console.log("Column already exists.");
      } else {
        console.error("Error adding column:", error);
      }
    } else {
      console.log("Column 'must_change_password' added successfully.");
    }
    
    // Also ensure all current users are marked to change password if they haven't yet
    connection.query("UPDATE users SET must_change_password = 1 WHERE role != 'RH_MANAGER' AND (password IS NOT NULL)", (err2) => {
       if (err2) console.error("Error updating users:", err2);
       else console.log("All non-admin users marked for password change.");
       connection.end();
       process.exit(0);
    });
  });
});
