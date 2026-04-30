-- 1. Création de la table des départements
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Ajout de la colonne department_id dans la table users (avec clé étrangère)
-- Assurez-vous que la colonne n'existe pas déjà avant de l'exécuter.
ALTER TABLE users 
ADD COLUMN department_id INT NULL,
ADD CONSTRAINT fk_user_department
FOREIGN KEY (department_id) 
REFERENCES departments(id) 
ON DELETE SET NULL;
