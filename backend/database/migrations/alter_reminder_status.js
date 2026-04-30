require('dotenv').config();
const db = require('./config/db');

const query = `
  CREATE TABLE IF NOT EXISTS reminder_status (
    user_id INT NOT NULL,
    reminder_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, reminder_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
  );
`;

db.query(query, (error, results) => {
  if (error) {
    console.error("Error creating table:", error);
  } else {
    console.log("Successfully created reminder_status table.");
  }
  process.exit();
});
