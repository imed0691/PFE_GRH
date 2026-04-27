const db = require('../config/db');

exports.requestPromotion = (req, res) => {
    const teacherId = req.user.id;
    const { current_grade, requested_grade } = req.body;

    const query = 'INSERT INTO promotions (teacher_id, current_grade, requested_grade, status) VALUES (?, ?, ?, "Pending")';
    db.query(query, [teacherId, current_grade, requested_grade], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error submitting promotion request' });
        res.status(201).json({ message: 'Promotion requested successfully', id: results.insertId });
    });
};

exports.getAllPromotions = (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
        SELECT p.*, u.nom, u.prenom, u.department_id, d.name AS department_name
        FROM promotions p
        JOIN users u ON p.teacher_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY p.submission_date DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching promotions' });

        if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
            return res.json(results.filter(p => p.teacher_id === userId));
        }

        if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
            // Need to get department_id of the Head
            db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
                if (err || deptRes.length === 0) return res.json([]);
                const headDeptId = deptRes[0].department_id;
                return res.json(results.filter(p => p.department_id === headDeptId));
            });
            return;
        }

        // Deans, Vice Deans, Rectors, HR can see all
        res.json(results);
    });
};

exports.recommendPromotion = (req, res) => {
    const { id } = req.params;
    const { recommendation } = req.body;

    const query = 'UPDATE promotions SET dept_head_recommendation = ?, status = "Recommended" WHERE id = ?';
    db.query(query, [recommendation, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error recommending promotion' });
        res.json({ message: 'Promotion recommended' });
    });
};

exports.approveRejectPromotion = (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'
    const handledBy = req.user.id;

    const query = 'UPDATE promotions SET status = ?, handled_by = ?, handling_date = NOW() WHERE id = ?';
    db.query(query, [status, handledBy, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error updating promotion status' });
        
        // If approved, update the user's grade
        if (status === 'Approved') {
            db.query('SELECT requested_grade, teacher_id FROM promotions WHERE id = ?', [id], (err, promoRes) => {
                if (promoRes && promoRes.length > 0) {
                    db.query('UPDATE users SET grade = ? WHERE id = ?', [promoRes[0].requested_grade, promoRes[0].teacher_id]);
                }
            });
        }
        res.json({ message: `Promotion ${status.toLowerCase()}` });
    });
};
