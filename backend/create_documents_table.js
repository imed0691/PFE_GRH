require('dotenv').config();
const db = require('./config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    status ENUM('Pending', 'Processing', 'Delivered', 'Rejected') DEFAULT 'Pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_note TEXT,
    handled_by INT,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);
`;

db.query(createTableQuery, (err, results) => {
    if (err) {
        console.error("Error creating documents table:", err);
    } else {
        console.log("Documents table created successfully.");
    }
    process.exit();
});
