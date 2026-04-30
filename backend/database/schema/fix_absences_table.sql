-- Correction de la table absences : ajout des colonnes manquantes pour le dashboard prof
ALTER TABLE absences 
ADD COLUMN justification_text TEXT NULL,
ADD COLUMN catchup_date DATE NULL,
ADD COLUMN catchup_start_time TIME NULL,
ADD COLUMN catchup_end_time TIME NULL;
