require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

const createModulesTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        study_level VARCHAR(50) NOT NULL,
        department_id INT NOT NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );
  `;
  
  db.query(query, (err) => {
    if (err) {
      console.error('Error creating modules table:', err.message);
      process.exit(1);
    }
    console.log('Modules table created or already exists.');
    
    // Seed some modules if empty
    db.query("SELECT COUNT(*) as count FROM modules", (err, results) => {
        if (results[0].count === 0) {
            const seedQuery = "INSERT INTO modules (name, study_level, department_id) VALUES ?";
            // Fetch first department to seed something
            db.query("SELECT id FROM departments LIMIT 1", (err, depts) => {
                if (depts.length > 0) {
                    const deptId = depts[0].id;
                    const values = [
                        ['Analyse 1', 'L1', deptId],
                        ['Algèbre 1', 'L1', deptId],
                        ['Structure Machine', 'L1', deptId],
                        ['Algorithmique', 'L1', deptId],
                        ['POO', 'L2', deptId],
                        ['Système d\'exploitation', 'L2', deptId],
                        ['Réseaux', 'L2', deptId],
                        ['Génie Logiciel', 'L3', deptId],
                        ['Compilation', 'L3', deptId],
                        ['Intelligence Artificielle', 'M1', deptId],
                        ['Data Mining', 'M2', deptId]
                    ];
                    db.query(seedQuery, [values], (err) => {
                        if (err) console.error('Error seeding modules:', err.message);
                        else console.log('Sample modules seeded successfully.');
                        process.exit(0);
                    });
                } else {
                    console.log('No departments found, skipping seeding.');
                    process.exit(0);
                }
            });
        } else {
            console.log('Modules table already has data.');
            process.exit(0);
        }
    });
  });
};

createModulesTable();
