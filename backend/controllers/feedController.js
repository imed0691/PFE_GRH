const db = require('../config/db');

// Get recent activity feed for the current user
exports.getFeed = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role.toUpperCase();

  // Build a UNION query to get recent items from all tables
  const queries = [];
  const params = [];

  // Evaluations
  queries.push(`
    SELECT 'evaluation' as type, e.id, e.created_at,
      CONCAT(ev.prenom, ' ', ev.nom) as actor_name,
      CONCAT('evaluated ', u.prenom, ' ', u.nom, ' — Rating: ', e.rating, '/10') as description,
      e.comments as detail
    FROM evaluations e
    JOIN users u ON e.teacher_id = u.id
    JOIN users ev ON e.evaluator_id = ev.id
    ORDER BY e.created_at DESC LIMIT 20
  `);

  // Absences
  queries.push(`
    SELECT 'absence' as type, a.id, a.created_at,
      CONCAT(u.prenom, ' ', u.nom) as actor_name,
      CONCAT('reported an absence on ', DATE_FORMAT(a.date, '%d/%m/%Y')) as description,
      a.reason as detail
    FROM absences a
    JOIN users u ON a.teacher_id = u.id
    ORDER BY a.created_at DESC LIMIT 20
  `);

  // Promotions
  queries.push(`
    SELECT 'promotion' as type, p.id, p.created_at,
      CONCAT(u.prenom, ' ', u.nom) as actor_name,
      CONCAT('requested promotion to ', p.requested_grade, ' — Status: ', p.status) as description,
      p.dept_head_recommendation as detail
    FROM promotions p
    JOIN users u ON p.teacher_id = u.id
    ORDER BY p.created_at DESC LIMIT 20
  `);

  // Recruitments
  queries.push(`
    SELECT 'recruitment' as type, r.id, r.created_at,
      CONCAT(u.prenom, ' ', u.nom) as actor_name,
      CONCAT('requested recruitment: ', r.position_title, ' — Status: ', r.status) as description,
      r.justification as detail
    FROM recruitments r
    JOIN users u ON r.requested_by = u.id
    ORDER BY r.created_at DESC LIMIT 20
  `);

  // Documents
  queries.push(`
    SELECT 'document' as type, d.id, d.created_at,
      CONCAT(u.prenom, ' ', u.nom) as actor_name,
      CONCAT('requested a ', d.document_type, ' — Status: ', d.status) as description,
      d.notes as detail
    FROM document_requests d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.created_at DESC LIMIT 20
  `);

  // Research
  queries.push(`
    SELECT 'research' as type, r.id, r.created_at,
      CONCAT(u.prenom, ' ', u.nom) as actor_name,
      CONCAT('added research: ', r.title, ' (', r.type, ')') as description,
      r.description as detail
    FROM research_activities r
    JOIN users u ON r.teacher_id = u.id
    ORDER BY r.created_at DESC LIMIT 20
  `);

  // Combine all with UNION ALL, then sort and limit
  const fullQuery = `
    SELECT * FROM (
      ${queries.join(' UNION ALL ')}
    ) AS feed
    ORDER BY created_at DESC
    LIMIT 50
  `;

  db.query(fullQuery, params, (err, results) => {
    if (err) {
      console.error('Feed query error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};
