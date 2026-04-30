require('dotenv').config();
const db = require('./config/db');

const sql = "ALTER TABLE absences ADD COLUMN is_archived_by_dept BOOLEAN DEFAULT FALSE;";

db.query(sql, (err, results) => {
    if (err) {
        if (err.code === 'ER_DUP_COLUMN') {
            console.log("Column already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    } else {
        console.log("Column is_archived_by_dept added successfully.");
    }
    process.exit();
});
