const db = require('../config/db');

// Get counts of new items per section for the current user
exports.getCounts = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role.toUpperCase();

  // Build queries based on role
  const sections = [];

  // Evaluations - everyone except teachers sees new evaluations
  if (['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'DEAN', 'DOYEN', 'RECTOR', 'RECTEUR',
       'VICE_DEAN', 'VICE_DOYEN', 'VICE_RECTOR', 'VICE_RECTEUR',
       'HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(userRole)) {
    sections.push({
      name: 'evaluations',
      query: `SELECT COUNT(*) as count FROM evaluations e 
              WHERE e.created_at > COALESCE(
                (SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'evaluations'),
                '2000-01-01'
              )`,
      params: [userId]
    });
  }

  // Teacher sees their own evaluations
  if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
    sections.push({
      name: 'evaluations',
      query: `SELECT COUNT(*) as count FROM evaluations e 
              WHERE e.teacher_id = ? AND e.created_at > COALESCE(
                (SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'evaluations'),
                '2000-01-01'
              )`,
      params: [userId, userId]
    });
  }

  // Research activities
  sections.push({
    name: 'research',
    query: `SELECT COUNT(*) as count FROM research_activities r 
            WHERE r.created_at > COALESCE(
              (SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'research'),
              '2000-01-01'
            )`,
    params: [userId]
  });

  // Absences - for admins
  if (['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'DEAN', 'DOYEN', 'RECTOR', 'RECTEUR',
       'VICE_DEAN', 'VICE_DOYEN', 'VICE_RECTOR', 'VICE_RECTEUR',
       'HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(userRole)) {
    sections.push({
      name: 'absences',
      query: `SELECT COUNT(*) as count FROM absences a 
              WHERE a.created_at > COALESCE(
                (SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'absences'),
                '2000-01-01'
              )`,
      params: [userId]
    });
  }

  // Promotions - Count pending requests based on role
  let promoStatus = '';
  if (['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT'].includes(userRole)) promoStatus = 'Pending_Dept';
  else if (['DEAN', 'DOYEN'].includes(userRole)) promoStatus = 'Pending_Dean';
  else if (['RECTOR', 'RECTEUR'].includes(userRole)) promoStatus = 'Pending_Rector';
  else if (['HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(userRole)) promoStatus = 'Pending_HR';

  if (promoStatus) {
    let promoQuery = `SELECT COUNT(*) as count FROM promotions p WHERE p.status = ?`;
    let promoParams = [promoStatus];

    if (promoStatus === 'Pending_Dept') {
      promoQuery = `
        SELECT COUNT(*) as count FROM promotions p 
        JOIN users u ON p.teacher_id = u.id 
        WHERE p.status = ? AND u.department_id = (SELECT department_id FROM users WHERE id = ?)
      `;
      promoParams.push(userId);
    }

    sections.push({
      name: 'promotions',
      query: promoQuery,
      params: promoParams
    });
  }

  // Recruitments
  if (['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'DEAN', 'DOYEN', 'RECTOR', 'RECTEUR',
       'HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(userRole)) {
    sections.push({
      name: 'recruitments',
      query: `SELECT COUNT(*) as count FROM recruitments r 
              WHERE r.created_at > COALESCE(
                (SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'recruitments'),
                '2000-01-01'
              )`,
      params: [userId]
    });
  }

  // Documents
  let docFilter = '';
  let docQuery = '';
  let docParams = [userId];

  if (['DEAN', 'DOYEN'].includes(userRole)) {
    docFilter = `AND (d.type = 'Work Certificate (Attestation de travail)' OR d.type = 'Mission Order (Ordre de mission)')`;
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE d.request_date > COALESCE((SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'documents'), '2000-01-01') ${docFilter}`;
  } else if (['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT'].includes(userRole)) {
    docFilter = `AND d.type = 'Teaching Load Certificate' AND u.department_id = (SELECT department_id FROM users WHERE id = ?)`;
    docQuery = `SELECT COUNT(*) as count FROM documents d JOIN users u ON d.teacher_id = u.id WHERE d.request_date > COALESCE((SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'documents'), '2000-01-01') ${docFilter}`;
    docParams.push(userId);
  } else if (['HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(userRole)) {
    docFilter = `AND d.type = 'Salary Slip (Fiche de paie)'`;
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE d.request_date > COALESCE((SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'documents'), '2000-01-01') ${docFilter}`;
  } else if (['TEACHER', 'ENSEIGNANT'].includes(userRole)) {
    docFilter = `AND d.teacher_id = ?`;
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE d.request_date > COALESCE((SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'documents'), '2000-01-01') ${docFilter}`;
    docParams.push(userId);
  } else {
    // Rectors / Admins
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE d.request_date > COALESCE((SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'documents'), '2000-01-01')`;
  }

  sections.push({
    name: 'documents',
    query: docQuery,
    params: docParams
  });

  // Execute all queries
  const results = {};
  let completed = 0;

  if (sections.length === 0) {
    return res.json({});
  }

  sections.forEach(section => {
    db.query(section.query, section.params, (err, rows) => {
      completed++;
      if (!err && rows && rows[0]) {
        results[section.name] = rows[0].count;
      } else {
        results[section.name] = 0;
      }

      if (completed === sections.length) {
        res.json(results);
      }
    });
  });
};

// Mark a section as seen
exports.markSeen = (req, res) => {
  const userId = req.user.id;
  const { section } = req.params;

  const query = `INSERT INTO user_section_views (user_id, section_name, last_viewed_at) 
                 VALUES (?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE last_viewed_at = NOW()`;

  db.query(query, [userId, section], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Marked as seen' });
  });
};
