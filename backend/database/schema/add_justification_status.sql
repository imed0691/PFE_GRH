-- Ajout de la colonne justification_status
ALTER TABLE absences 
ADD COLUMN justification_status ENUM('None', 'Pending', 'Accepted', 'Rejected') DEFAULT 'None' AFTER has_justification;
