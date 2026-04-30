require('dotenv').config();
const db = require('./config/db');

const alterTableQuery = `
ALTER TABLE absence_requests 
MODIFY COLUMN status ENUM('Pending', 'Recommended', 'Approved', 'Rejected') DEFAULT 'Pending';
`;

db.query(alterTableQuery, (err, results) => {
    if (err) {
        console.error("Error altering absence_requests table:", err);
    } else {
        console.log("absence_requests table altered successfully.");
    }
    process.exit();
});
