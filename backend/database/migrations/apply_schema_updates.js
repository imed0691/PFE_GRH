require('dotenv').config();
const mysql = require('mysql2/promise');

async function runUpdate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log(`Connected to database: ${process.env.DB_NAME}`);

  // Check for table name inconsistencies
  const [tables] = await connection.query("SHOW TABLES");
  const tableNames = tables.map(t => Object.values(t)[0]);
  
  if (!tableNames.includes('absences') && tableNames.includes('absence_requests')) {
    console.log("Renaming absence_requests to absences...");
    await connection.query("RENAME TABLE absence_requests TO absences");
  }

  // Ensure modules table exists
  await connection.query(`CREATE TABLE IF NOT EXISTS modules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      study_level VARCHAR(50) NOT NULL,
      department_id INT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
  )`);

  // Ensure absences table exists with base columns
  await connection.query(`CREATE TABLE IF NOT EXISTS absences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT NOT NULL,
      date DATE NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Approved',
      has_justification BOOLEAN DEFAULT FALSE,
      is_caught_up BOOLEAN DEFAULT FALSE,
      is_read_by_admin BOOLEAN DEFAULT FALSE,
      is_read_by_teacher BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Helper to add missing columns if they were missing in absence_requests
  const [absColumns] = await connection.query("DESCRIBE absences");
  const absColNames = absColumns.map(c => c.Field);
  
  const baseAbsColumns = [
    { name: 'has_justification', def: 'BOOLEAN DEFAULT FALSE' },
    { name: 'is_caught_up', def: 'BOOLEAN DEFAULT FALSE' }
  ];

  for (const col of baseAbsColumns) {
    if (!absColNames.includes(col.name)) {
      console.log(`Adding missing base column ${col.name} to absences...`);
      await connection.query(`ALTER TABLE absences ADD COLUMN ${col.name} ${col.def}`);
    }
  }

  const queries = [
    // 1. Structure Tables
    `CREATE TABLE IF NOT EXISTS study_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        department_id INT NOT NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        study_level_id INT NOT NULL,
        FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS student_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        section_id INT NOT NULL,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS teacher_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        module_id INT NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
        UNIQUE KEY unique_teacher_module (teacher_id, module_id)
    )`,

    // 2. academic_sessions
    `ALTER TABLE academic_sessions ADD COLUMN study_level_id INT NOT NULL AFTER session_type`,
    `ALTER TABLE academic_sessions ADD COLUMN section_id INT NULL AFTER end_time`,
    `ALTER TABLE academic_sessions ADD COLUMN group_id INT NULL AFTER section_id`,
    `ALTER TABLE academic_sessions DROP COLUMN study_level`,
    `ALTER TABLE academic_sessions DROP COLUMN section`,
    `ALTER TABLE academic_sessions DROP COLUMN groupe`,
    `ALTER TABLE academic_sessions ADD CONSTRAINT fk_sessions_study_level FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE`,
    `ALTER TABLE academic_sessions ADD CONSTRAINT fk_sessions_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL`,
    `ALTER TABLE academic_sessions ADD CONSTRAINT fk_sessions_group FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE SET NULL`,

    // 3. modules
    `ALTER TABLE modules ADD COLUMN study_level_id INT NOT NULL AFTER name`,
    `ALTER TABLE modules DROP COLUMN study_level`,
    `ALTER TABLE modules ADD CONSTRAINT fk_modules_study_level FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE`,

    // 4. absences
    `ALTER TABLE absences ADD COLUMN justification_text TEXT NULL`,
    `ALTER TABLE absences ADD COLUMN catchup_date DATE NULL`,
    `ALTER TABLE absences ADD COLUMN catchup_start_time TIME NULL`,
    `ALTER TABLE absences ADD COLUMN catchup_end_time TIME NULL`,
    `ALTER TABLE absences ADD COLUMN justification_file VARCHAR(255) NULL`,
    `ALTER TABLE absences ADD COLUMN justification_status ENUM('None', 'Pending', 'Accepted', 'Rejected') DEFAULT 'None' AFTER has_justification`
  ];

  for (const query of queries) {
    try {
      await connection.query(query);
      console.log(`Successfully executed: ${query.substring(0, 50)}...`);
    } catch (error) {
      if (error.code === 'ER_DUP_COLUMN_NAME') {
        console.log(`Skipped (column already exists): ${query.substring(0, 50)}...`);
      } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log(`Skipped (field/key not found): ${query.substring(0, 50)}...`);
      } else if (error.code === 'ER_DUP_KEY') {
        console.log(`Skipped (key already exists): ${query.substring(0, 50)}...`);
      } else if (error.code === 'ER_DUP_CONSTRAINT_NAME') {
        console.log(`Skipped (constraint already exists): ${query.substring(0, 50)}...`);
      } else if (error.code === 'ER_FK_COLUMN_CANNOT_DROP') {
        console.log(`Skipped (FK dependency): ${query.substring(0, 50)}...`);
      } else {
        console.error(`Error executing query: ${query.substring(0, 50)}...`);
        console.error(error.message);
      }
    }
  }

  await connection.end();
  console.log("Database update process completed.");
}

runUpdate().catch(err => {
  console.error("Critical error during migration:", err);
  process.exit(1);
});
