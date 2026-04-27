const db = require('../config/db');

// Enseignant: Ajouter une activité de recherche
exports.addResearchActivity = (req, res) => {
  const teacher_id = req.user.id;
  const { title, type, date, description, link } = req.body;

  if (!title || !type || !date) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }

  const query = "INSERT INTO research_activities (teacher_id, title, type, date, description, link) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [teacher_id, title, type, date, description, link], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Activité de recherche ajoutée." });
  });
};

// Voir les activités de recherche
exports.getResearchActivities = (req, res) => {
  const userRole = req.user.role.toUpperCase();
  const userId = req.user.id;

  let query = `
    SELECT r.*, u.nom as teacher_nom, u.prenom as teacher_prenom, u.department_id 
    FROM research_activities r
    JOIN users u ON r.teacher_id = u.id
  `;
  let params = [];

  if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
    query += " WHERE r.teacher_id = ?";
    params.push(userId);
  } else if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
    query += " WHERE u.department_id = (SELECT department_id FROM users WHERE id = ?)";
    params.push(userId);
  }

  query += " ORDER BY r.date DESC";

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
