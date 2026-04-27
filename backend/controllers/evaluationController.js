const db = require('../config/db');

// Dept Head: Créer une évaluation
exports.createEvaluation = (req, res) => {
  const evaluator_id = req.user.id;
  const { teacher_id, academic_year, rating, comments } = req.body;

  if (!teacher_id || !academic_year || !rating) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }

  const query = "INSERT INTO evaluations (teacher_id, evaluator_id, academic_year, rating, comments) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [teacher_id, evaluator_id, academic_year, rating, comments], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Évaluation enregistrée avec succès." });
  });
};

// Voir les évaluations (Filtre selon rôle)
exports.getEvaluations = (req, res) => {
  const userRole = req.user.role.toUpperCase();
  const userId = req.user.id;

  let query = `
    SELECT e.*, u.nom as teacher_nom, u.prenom as teacher_prenom, u.department_id,
           ev.nom as evaluator_nom, ev.prenom as evaluator_prenom
    FROM evaluations e
    JOIN users u ON e.teacher_id = u.id
    JOIN users ev ON e.evaluator_id = ev.id
  `;
  let params = [];

  if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
    query += " WHERE e.teacher_id = ?";
    params.push(userId);
  } else if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
    // Dept Head voit les évaluations qu'il a faites OU celles de son département
    query += " WHERE e.evaluator_id = ? OR u.department_id = (SELECT department_id FROM users WHERE id = ?)";
    params.push(userId, userId);
  }

  query += " ORDER BY e.created_at DESC";

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
