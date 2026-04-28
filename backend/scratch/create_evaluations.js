require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

const createEvaluationsTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS evaluations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        evaluator_id INT NOT NULL,
        academic_year VARCHAR(50) NOT NULL,
        rating INT NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  
  db.query(query, (err) => {
    if (err) {
      console.error('Error creating evaluations table:', err.message);
      process.exit(1);
    }
    console.log('Evaluations table created or already exists.');
    process.exit(0);
  });
};

createEvaluationsTable();
