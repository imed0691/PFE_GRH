const db = require('../config/db');

// Get counts of new items per section for the current user
exports.getCounts = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role ? req.user.role.toUpperCase().replace(/[\s-]/g, '_') : '';

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

  // Absences - for managers (Dept Head / HR sees new justifications)
  if (['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'DEAN', 'DOYEN', 'RECTOR', 'RECTEUR',
       'VICE_DEAN', 'VICE_DOYEN', 'VICE_RECTOR', 'VICE_RECTEUR',
       'HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(userRole)) {
    sections.push({
      name: 'absences',
      query: `SELECT COUNT(*) as count FROM absences a 
              JOIN users u ON a.teacher_id = u.id
              WHERE a.is_read_by_admin = FALSE 
              AND a.is_cleared = FALSE
              AND a.justification_status = 'Pending'
              AND (
                u.department_id = (SELECT department_id FROM users WHERE id = ?)
                OR ? IN ('ADMIN', 'HR', 'RH', 'HR_MANAGER', 'RH_MANAGER')
              )`,
      params: [userId, userRole]
    });
  }

  // Absences - for teachers (see new absences recorded for them)
  if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
    sections.push({
      name: 'absences',
      query: `SELECT COUNT(*) as count FROM absences a 
              WHERE a.teacher_id = ? AND a.is_read_by_teacher = FALSE AND a.is_cleared = FALSE`,
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

  // Documents - New Routing & Workflow Badge Logic
  let docFilter = '';
  let docQuery = '';
  let docParams = [userId];

  if (['DEAN', 'DOYEN', 'RECTOR', 'RECTEUR'].some(r => userRole.includes(r))) {
    // Authority sees documents waiting for signature
    docFilter = `AND d.status = 'HR_APPROVED'`;
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE 1=1 ${docFilter}`;
  } else if (['DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT'].includes(userRole)) {
    // Dept Head sees initial pending requests
    docFilter = `AND d.status = 'PENDING' AND u.department_id = (SELECT department_id FROM users WHERE id = ?)`;
    docQuery = `SELECT COUNT(*) as count FROM documents d JOIN users u ON d.teacher_id = u.id WHERE 1=1 ${docFilter}`;
    docParams.push(userId);
  } else if (['HR', 'RH', 'HR_MANAGER', 'RH_MANAGER', 'ADMIN'].includes(userRole)) {
    // HR sees items to process
    docFilter = `AND d.status IN ('HEAD_APPROVED', 'PROCESSING')`;
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE 1=1 ${docFilter}`;
  } else if (['TEACHER', 'ENSEIGNANT'].includes(userRole)) {
    // Teacher sees finished documents they haven't acknowledged yet
    docFilter = `AND d.teacher_id = ? AND d.status = 'AVAILABLE'`;
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE d.updated_at > COALESCE((SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'documents'), '2000-01-01') ${docFilter}`;
    docParams.push(userId);
  } else {
    docQuery = `SELECT COUNT(*) as count FROM documents d WHERE 1=0`; // Default none
  }

  sections.push({
    name: 'documents',
    query: docQuery,
    params: docParams
  });

  sections.push({
    name: 'reminders',
    query: `SELECT COUNT(*) as count FROM reminders r 
            LEFT JOIN users u ON r.sender_id = u.id
            WHERE r.sender_id != ? AND (
               (r.teacher_id = ? 
               OR (r.teacher_id IS NULL AND r.department_id = (SELECT department_id FROM users WHERE id = ?))
               OR (r.teacher_id IS NULL AND r.department_id IS NULL AND (
                    u.role IN ('RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR')
                    OR (SELECT role FROM users WHERE id = ?) NOT IN ('RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR')
               )))
            )
            AND r.created_at > COALESCE(
              (SELECT last_viewed_at FROM user_section_views WHERE user_id = ? AND section_name = 'reminders'),
              '2000-01-01'
            )`,
    params: [userId, userId, userId, userId, userId]
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

    // Custom logic for sections using specific read flags
    if (section === 'absences') {
      const userRole = req.user.role ? req.user.role.toUpperCase().replace(/[\s-]/g, '_') : '';
      if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
        db.query("UPDATE absences SET is_read_by_teacher = TRUE WHERE teacher_id = ?", [userId]);
      } else {
        // Managers mark as read items in their department or all if HR/Admin
        db.query(`
          UPDATE absences a
          JOIN users u ON a.teacher_id = u.id
          SET a.is_read_by_admin = TRUE
          WHERE (u.department_id = (SELECT department_id FROM (SELECT department_id FROM users WHERE id = ?) as tmp)
          OR ? IN ('ADMIN', 'HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'))
        `, [userId, userRole]);
      }
    }

    res.json({ message: 'Marked as seen' });
  });
};
