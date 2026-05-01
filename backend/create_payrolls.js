const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const query = `
  CREATE TABLE IF NOT EXISTS payrolls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    base_salary DECIMAL(10,2),
    extra_hours DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    absence_penalty DECIMAL(10,2),
    total_penalty DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'Paid',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )
`;

db.query(query, (err) => {
  if (err) {
    console.error("Error creating payrolls table:", err);
  } else {
    console.log("Table payrolls created or already exists");
  }
  process.exit(0);
});
