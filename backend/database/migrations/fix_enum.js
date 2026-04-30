require('dotenv').config();
const db = require('./config/db');

const alterQuery = "ALTER TABLE documents MODIFY COLUMN status ENUM('Pending', 'Processing', 'Ready', 'Delivered', 'Rejected') DEFAULT 'Pending'";

db.query(alterQuery, (err, results) => {
    if (err) {
        console.error("Error updating ENUM:", err);
    } else {
        console.log("Database ENUM updated successfully! 'Ready' status is now allowed.");
    }
    process.exit();
});
