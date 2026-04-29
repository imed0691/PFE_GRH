const db = require('../config/db');

exports.requestPromotion = (req, res) => {
    const teacherId = req.user.id;
    const { requested_grade } = req.body;

    if (!requested_grade) {
        return res.status(400).json({ message: 'Requested grade is required' });
    }

    db.query('SELECT grade FROM users WHERE id = ?', [teacherId], (err, userResults) => {
        if (err || userResults.length === 0) return res.status(500).json({ message: 'Error fetching current grade' });

        const current_grade = userResults[0].grade || 'Teacher';
        const query = 'INSERT INTO promotions (teacher_id, current_grade, requested_grade, status) VALUES (?, ?, ?, "Pending_Dept")';
        db.query(query, [teacherId, current_grade, requested_grade], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error submitting promotion request' });
            res.status(201).json({ message: 'Promotion requested successfully' });
        });
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
            db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
                if (err || deptRes.length === 0) return res.json([]);
                const headDeptId = deptRes[0].department_id;
                return res.json(results.filter(p => p.department_id === headDeptId && p.status === 'Pending_Dept'));
            });
            return;
        }

        if (userRole === 'DEAN' || userRole === 'DOYEN') {
            return res.json(results.filter(p => p.status === 'Pending_Dean'));
        }

        if (userRole === 'RECTOR' || userRole === 'RECTEUR') {
            return res.json(results.filter(p => p.status === 'Pending_Rector'));
        }

        if (userRole === 'HR' || userRole === 'RH' || userRole === 'HR_MANAGER' || userRole === 'RH_MANAGER') {
            // HR can see those pending for them and approved/rejected history
            return res.json(results.filter(p => ['Pending_HR', 'Approved', 'Rejected'].includes(p.status)));
        }

        res.json(results);
    });
};

exports.recommendPromotion = (req, res) => {
    const { id } = req.params;
    const { recommendation } = req.body;
    const userRole = req.user.role;

    let nextStatus = '';
    let rolePrefix = '';
    if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
        nextStatus = 'Pending_Dean';
        rolePrefix = 'Chef de Dépt';
    }
    else if (userRole === 'DEAN' || userRole === 'DOYEN') {
        nextStatus = 'Pending_Rector';
        rolePrefix = 'Doyen';
    }
    else if (userRole === 'RECTOR' || userRole === 'RECTEUR') {
        nextStatus = 'Pending_HR';
        rolePrefix = 'Recteur';
    }
    else return res.status(403).json({ message: 'Unauthorized to recommend' });

    const newRecText = `${rolePrefix}: ${recommendation}`;

    const query = `
        UPDATE promotions 
        SET dept_head_recommendation = CASE 
            WHEN dept_head_recommendation IS NULL OR dept_head_recommendation = '' THEN ? 
            ELSE CONCAT(dept_head_recommendation, '\n', ?) 
        END, 
        status = ? 
        WHERE id = ?`;
        
    db.query(query, [newRecText, newRecText, nextStatus, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error recommending promotion' });
        res.json({ message: `Promotion sent to next level: ${nextStatus}` });
    });
};

exports.approveRejectPromotion = (req, res) => {
    const { id } = req.params;
    const { status, finalGrade } = req.body; // 'Approved' or 'Rejected'
    const handledBy = req.user.id;

    const query = 'UPDATE promotions SET status = ?, handled_by = ?, handling_date = NOW() WHERE id = ?';
    db.query(query, [status, handledBy, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error updating promotion status' });
        
        if (status === 'Approved') {
            db.query('SELECT requested_grade, teacher_id FROM promotions WHERE id = ?', [id], (err, promoRes) => {
                if (promoRes && promoRes.length > 0) {
                    const gradeToSet = finalGrade || promoRes[0].requested_grade;
                    db.query('UPDATE users SET grade = ? WHERE id = ?', [gradeToSet, promoRes[0].teacher_id]);
                }
            });
        }
        res.json({ message: `Promotion ${status.toLowerCase()}` });
    });
};
