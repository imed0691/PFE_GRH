-- Ajout de la colonne department_id à la table reminders
ALTER TABLE reminders 
ADD COLUMN department_id INT NULL AFTER teacher_id,
ADD CONSTRAINT fk_reminder_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;
