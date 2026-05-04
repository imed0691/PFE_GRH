const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const migrations = [
  // Users
  { table: 'users', column: 'profile_image', sql: "ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL" },
  
  // Absences
  { table: 'absences', column: 'start_time', sql: "ALTER TABLE absences ADD COLUMN start_time TIME NULL" },
  { table: 'absences', column: 'end_time', sql: "ALTER TABLE absences ADD COLUMN end_time TIME NULL" },
  { table: 'absences', column: 'is_extra', sql: "ALTER TABLE absences ADD COLUMN is_extra BOOLEAN DEFAULT FALSE" },
  { table: 'absences', column: 'justification_status', sql: "ALTER TABLE absences ADD COLUMN justification_status VARCHAR(50) DEFAULT 'None'" },
  { table: 'absences', column: 'justification_text', sql: "ALTER TABLE absences ADD COLUMN justification_text TEXT NULL" },
  { table: 'absences', column: 'justification_file', sql: "ALTER TABLE absences ADD COLUMN justification_file VARCHAR(255) NULL" },
  { table: 'absences', column: 'catchup_date', sql: "ALTER TABLE absences ADD COLUMN catchup_date DATE NULL" },
  { table: 'absences', column: 'catchup_start_time', sql: "ALTER TABLE absences ADD COLUMN catchup_start_time TIME NULL" },
  { table: 'absences', column: 'catchup_end_time', sql: "ALTER TABLE absences ADD COLUMN catchup_end_time TIME NULL" },

  // Promotions (redundant but safe)
  { table: 'promotions', column: 'file_path', sql: "ALTER TABLE promotions ADD COLUMN file_path VARCHAR(255) NULL AFTER requested_grade" },
  { table: 'promotions', column: 'status', sql: "ALTER TABLE promotions MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending_Dept'" },

  // Sessions
  { table: 'academic_sessions', column: 'study_level_id', sql: "ALTER TABLE academic_sessions ADD COLUMN study_level_id INT NULL" },
  { table: 'academic_sessions', column: 'section_id', sql: "ALTER TABLE academic_sessions ADD COLUMN section_id INT NULL" },
  { table: 'academic_sessions', column: 'group_id', sql: "ALTER TABLE academic_sessions ADD COLUMN group_id INT NULL" },
  { table: 'academic_sessions', column: 'is_extra', sql: "ALTER TABLE academic_sessions ADD COLUMN is_extra BOOLEAN DEFAULT FALSE" },
  { table: 'academic_sessions', column: 'session_date', sql: "ALTER TABLE academic_sessions ADD COLUMN session_date DATE NULL" }
];

const checkAndMigrate = async () => {
  for (const m of migrations) {
    try {
      const [rows] = await db.promise().query(`SHOW COLUMNS FROM ${m.table} LIKE '${m.column}'`);
      if (rows.length === 0) {
        console.log(`[SYNC] Adding missing column ${m.column} to ${m.table}...`);
        await db.promise().query(m.sql);
        console.log(`[SYNC] Successfully added ${m.column}.`);
      } else if (m.sql.includes('MODIFY')) {
        console.log(`[SYNC] Updating column ${m.column} in ${m.table}...`);
        await db.promise().query(m.sql);
      }
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        // Safe to ignore if already there
      } else {
        console.error(`[SYNC] Error with ${m.table}.${m.column}:`, err.message);
      }
    }
  }
  console.log("[SYNC] Database synchronization complete.");
  db.end();
  process.exit(0);
};

checkAndMigrate();
