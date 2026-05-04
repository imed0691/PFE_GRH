-- Création de la base de données
CREATE DATABASE IF NOT EXISTS pfe_db;
USE pfe_db;

-- 1. Création de la table des départements
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE
);

-- 2. Création de la table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department_id INT NULL,
    profile_image VARCHAR(255) NULL,
    volume_horaire INT DEFAULT 192,
    absences INT DEFAULT 0,
    grade VARCHAR(50) DEFAULT 'Teacher',
    hourly_rate INT DEFAULT 0,
    absence_penalty INT DEFAULT 0,
    base_salary INT DEFAULT 0,
    extra_hours INT DEFAULT 0,
    must_change_password BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 3. Création de la table des niveaux d'étude
CREATE TABLE IF NOT EXISTS study_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 4. Création de la table des sections
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    study_level_id INT NOT NULL,
    FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE
);

-- 5. Création de la table des groupes
CREATE TABLE IF NOT EXISTS student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    section_id INT NOT NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- 6. Création de la table des modules
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    study_level_id INT NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE
);

-- 7. Création de la table des sessions académiques
CREATE TABLE IF NOT EXISTS academic_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(191) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- ex: 'Lecture', 'Tutorial', 'Practical'
    study_level_id INT NOT NULL,
    teacher_id INT NOT NULL,
    department_id INT NOT NULL,
    day_of_week VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    section_id INT NULL,
    group_id INT NULL,
    is_extra BOOLEAN DEFAULT FALSE,
    session_date DATE NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE SET NULL
);

-- 8. Création de la table des absences
CREATE TABLE IF NOT EXISTS absences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    is_extra BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Approved',
    has_justification BOOLEAN DEFAULT FALSE,
    justification_status VARCHAR(50) DEFAULT 'None',
    justification_text TEXT NULL,
    justification_file VARCHAR(255) NULL,
    is_caught_up BOOLEAN DEFAULT FALSE,
    catchup_date DATE NULL,
    catchup_start_time TIME NULL,
    catchup_end_time TIME NULL,
    is_read_by_admin BOOLEAN DEFAULT FALSE,
    is_read_by_teacher BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Création de la table des rappels
CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NULL,
    department_id INT NULL,
    sender_id INT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 10. Table d'état des rappels
CREATE TABLE IF NOT EXISTS reminder_status (
    user_id INT NOT NULL,
    reminder_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, reminder_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
);

-- 11. Création de la table des promotions
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    current_grade VARCHAR(100) NOT NULL,
    requested_grade VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NULL,
    submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    dept_head_recommendation TEXT,
    status VARCHAR(50) DEFAULT 'Pending_Dept',
    handled_by INT,
    handling_date DATETIME,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Création de la table des documents
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    status ENUM('Pending', 'Processing', 'Delivered', 'Rejected') DEFAULT 'Pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_note TEXT,
    handled_by INT,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Activités de recherche
CREATE TABLE IF NOT EXISTS research_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Évaluations
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

-- 15. Création de la table des recrutements
CREATE TABLE IF NOT EXISTS recruitments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    requested_by INT NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    vacancies_count INT NOT NULL,
    justification TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    handled_by INT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);
