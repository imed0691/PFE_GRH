require('dotenv').config();
const db = require('./config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    current_grade VARCHAR(100) NOT NULL,
    requested_grade VARCHAR(100) NOT NULL,
    submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    dept_head_recommendation TEXT,
    status ENUM('Pending', 'Recommended', 'Approved', 'Rejected') DEFAULT 'Pending',
    handled_by INT,
    handling_date DATETIME,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);
`;

db.query(createTableQuery, (err, results) => {
    if (err) {
        console.error("Error creating promotions table:", err);
    } else {
        console.log("Promotions table created or already exists.");
    }
    process.exit();
});
