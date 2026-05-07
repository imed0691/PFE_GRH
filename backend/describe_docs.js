require('dotenv').config();
const db = require('./config/db');

db.query('DESCRIBE documents', (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.table(results);
    process.exit(0);
});
