-- 1. Création des nouvelles tables dynamiques
CREATE TABLE IF NOT EXISTS study_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    study_level_id INT NOT NULL,
    FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    section_id INT NOT NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- 2. Vider les anciennes données car leur structure devient incompatible
TRUNCATE TABLE academic_sessions;
TRUNCATE TABLE modules;

-- 3. Mise à jour de la table academic_sessions
ALTER TABLE academic_sessions
DROP COLUMN study_level,
DROP COLUMN section,
DROP COLUMN groupe;

ALTER TABLE academic_sessions
ADD COLUMN study_level_id INT NOT NULL AFTER session_type,
ADD COLUMN section_id INT NULL AFTER end_time,
ADD COLUMN group_id INT NULL AFTER section_id;

ALTER TABLE academic_sessions
ADD FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE,
ADD FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
ADD FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE SET NULL;

-- 4. Mise à jour de la table modules
ALTER TABLE modules
DROP COLUMN study_level;

ALTER TABLE modules
ADD COLUMN study_level_id INT NOT NULL AFTER name;

ALTER TABLE modules
ADD FOREIGN KEY (study_level_id) REFERENCES study_levels(id) ON DELETE CASCADE;
