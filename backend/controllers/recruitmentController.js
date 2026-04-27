const db = require('../config/db');

exports.requestRecruitment = (req, res) => {
    const userId = req.user.id;
    const { position_title, vacancies_count, justification } = req.body;

    // First get the department_id of the Head of Dept
    db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, userRes) => {
        if (err || userRes.length === 0) return res.status(500).json({ message: 'Error identifying user department' });
        
        const departmentId = userRes[0].department_id;

        const query = 'INSERT INTO recruitments (department_id, requested_by, position_title, vacancies_count, justification) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [departmentId, userId, position_title, vacancies_count, justification], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error submitting recruitment request' });
            res.status(201).json({ message: 'Recruitment requested successfully' });
        });
    });
};

exports.getAllRecruitments = (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
        SELECT r.*, u.nom, u.prenom, d.name AS department_name
        FROM recruitments r
        JOIN users u ON r.requested_by = u.id
        JOIN departments d ON r.department_id = d.id
        ORDER BY r.request_date DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching recruitments' });

        if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
            db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
                if (err || deptRes.length === 0) return res.json([]);
                const headDeptId = deptRes[0].department_id;
                return res.json(results.filter(r => r.department_id === headDeptId));
            });
            return;
        }

        // Deans and Rectors see all
        res.json(results);
    });
};

exports.updateRecruitmentStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Dean_Approved', 'Rector_Approved', 'Rejected'
    const handledBy = req.user.id;

    const query = 'UPDATE recruitments SET status = ?, handled_by = ? WHERE id = ?';
    db.query(query, [status, handledBy, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error updating recruitment status' });
        res.json({ message: `Recruitment status updated to ${status}` });
    });
};
