-- SCRIPT DE RÉPARATION (Version compatible)

-- 1. Si cette ligne fait erreur "Duplicate column", ignorez-la et passez à la suite
ALTER TABLE reminders ADD COLUMN department_id INT NULL AFTER teacher_id;

-- 2. Ajout des colonnes pour les absences
ALTER TABLE absences ADD COLUMN justification_text TEXT NULL;
ALTER TABLE absences ADD COLUMN catchup_date DATE NULL;
ALTER TABLE absences ADD COLUMN catchup_start_time TIME NULL;
ALTER TABLE absences ADD COLUMN catchup_end_time TIME NULL;
