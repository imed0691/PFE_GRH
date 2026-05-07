require('dotenv').config();
const db = require('./config/db');

const fixDocsTable = async () => {
    console.log("Fixing documents table schema (Method 2)...");
    
    // 1. Check current columns
    db.query('DESCRIBE documents', async (err, results) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        const columns = results.map(r => r.Field);
        
        if (!columns.includes('authority_role')) {
            console.log("Adding authority_role...");
            await new Promise(r => db.query("ALTER TABLE documents ADD COLUMN authority_role VARCHAR(50) DEFAULT 'HR_MANAGER' AFTER response_note", r));
        }
        
        if (!columns.includes('pdf_path')) {
            console.log("Adding pdf_path...");
            await new Promise(r => db.query("ALTER TABLE documents ADD COLUMN pdf_path VARCHAR(255) DEFAULT NULL AFTER authority_role", r));
        }

        console.log("Updating status ENUM...");
        await new Promise(r => db.query("ALTER TABLE documents MODIFY COLUMN status ENUM('Pending', 'HEAD_APPROVED', 'Processing', 'HR_APPROVED', 'SIGNED', 'Available', 'Rejected') DEFAULT 'Pending'", r));

        console.log("Database fix complete.");
        process.exit(0);
    });
};

fixDocsTable();
