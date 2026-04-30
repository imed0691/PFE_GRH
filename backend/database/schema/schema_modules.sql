-- Création de la table de liaison entre les enseignants et les modules
CREATE TABLE IF NOT EXISTS teacher_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    module_id INT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_teacher_module (teacher_id, module_id)
);
