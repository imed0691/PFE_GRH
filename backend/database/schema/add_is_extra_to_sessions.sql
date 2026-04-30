USE pfe_db;
ALTER TABLE academic_sessions ADD COLUMN is_extra BOOLEAN DEFAULT FALSE;
