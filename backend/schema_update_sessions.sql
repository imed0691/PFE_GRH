-- 1. Création de la table des séances / cours
CREATE TABLE IF NOT EXISTS academic_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(191) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- e.g., 'Cours', 'TD', 'TP'
    teacher_id INT NOT NULL,
    department_id INT NOT NULL,
    day_of_week VARCHAR(50) NOT NULL, -- e.g., 'Lundi', 'Mardi'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);
