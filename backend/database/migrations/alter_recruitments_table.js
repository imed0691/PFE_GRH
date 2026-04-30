require('dotenv').config();
const db = require('./config/db');

const alterTableQuery = `
ALTER TABLE recruitments 
MODIFY COLUMN status ENUM('Pending', 'Dean_Approved', 'Rector_Approved', 'Published', 'Completed', 'Rejected') DEFAULT 'Pending';
`;

db.query(alterTableQuery, (err, results) => {
    if (err) {
        console.error("Error altering recruitments table:", err);
    } else {
        console.log("Recruitments table updated successfully with new statuses.");
    }
    process.exit();
});
