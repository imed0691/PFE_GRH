-- Academic sessions table
CREATE TABLE IF NOT EXISTS academic_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(191) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- e.g., 'Lecture', 'Tutorial', 'Practical'
    study_level VARCHAR(50) NOT NULL, -- e.g., 'L1', 'L2', 'M1'
    teacher_id INT NOT NULL,
    department_id INT NOT NULL,
    day_of_week VARCHAR(50) NOT NULL, -- e.g., 'Monday', 'Tuesday'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);
