require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

const addAuthorityRole = "ALTER TABLE documents ADD COLUMN authority_role VARCHAR(50) DEFAULT 'HR_MANAGER'";
const addPdfPath = "ALTER TABLE documents ADD COLUMN pdf_path VARCHAR(255) DEFAULT NULL";

db.query(addAuthorityRole, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('authority_role error:', err.message);
    else console.log('authority_role column ready.');

    db.query(addPdfPath, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('pdf_path error:', err.message);
        else console.log('pdf_path column ready.');
        
        process.exit(0);
    });
});
