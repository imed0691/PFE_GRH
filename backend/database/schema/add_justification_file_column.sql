-- Ajout de la colonne justification_file pour stocker le nom du fichier uploadé
ALTER TABLE absences ADD COLUMN justification_file VARCHAR(255) NULL;
