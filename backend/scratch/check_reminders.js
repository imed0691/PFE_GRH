require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');
db.query('DESCRIBE reminders', (err, results) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('Results:', results);
    }
    process.exit();
});
