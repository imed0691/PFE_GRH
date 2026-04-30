require('dotenv').config();
const db = require('./config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS recruitments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    requested_by INT NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    vacancies_count INT NOT NULL DEFAULT 1,
    justification TEXT,
    status ENUM('Pending', 'Dean_Approved', 'Rector_Approved', 'Rejected') DEFAULT 'Pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    handled_by INT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);
`;

db.query(createTableQuery, (err, results) => {
    if (err) {
        console.error("Error creating recruitments table:", err);
    } else {
        console.log("Recruitments table created successfully.");
    }
    process.exit();
});
