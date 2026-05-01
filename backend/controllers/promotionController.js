const db = require('../config/db');

exports.requestPromotion = (req, res) => {
    const teacherId = req.user.id;
    const { requested_grade } = req.body;

    if (!requested_grade) {
        return res.status(400).json({ message: 'Requested grade is required' });
    }

    const gradeHierarchy = ['Teacher', 'Vacataire', 'Assistant', 'MAB', 'MAA', 'MCB', 'MCA', 'Professeur'];

    db.query('SELECT grade FROM users WHERE id = ?', [teacherId], (err, userResults) => {
        if (err || userResults.length === 0) {
            console.error("[PromotionRequest] Error fetching current grade:", err);
            return res.status(500).json({ message: 'Error fetching current grade', error: err });
        }

        const current_grade = userResults[0].grade || 'Teacher';
        
        // Validation: Must be higher in hierarchy
        const currentIndex = gradeHierarchy.findIndex(g => g.toUpperCase() === current_grade.toUpperCase());
        const requestedIndex = gradeHierarchy.findIndex(g => g.toUpperCase() === requested_grade.toUpperCase());

        if (requestedIndex <= currentIndex) {
            return res.status(400).json({ message: 'Impossible de demander un grade inférieur ou identique à votre grade actuel.' });
        }

        const filePath = req.file ? req.file.filename : null;
        
        const query = 'INSERT INTO `promotions` (`teacher_id`, `current_grade`, `requested_grade`, `file_path`, `status`) VALUES (?, ?, ?, ?, "Pending_Dept")';
        db.query(query, [teacherId, current_grade, requested_grade, filePath], (err, results) => {
            if (err) {
                console.error("[PromotionRequest] INSERT error:", err);
                return res.status(500).json({ message: 'Error submitting promotion request', error: err.message });
            }
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
    const { status, finalGrade, hourly_rate, absence_penalty, base_salary } = req.body; // 'Approved' or 'Rejected'
    const handledBy = req.user.id;

    const query = 'UPDATE promotions SET status = ?, handled_by = ?, handling_date = NOW() WHERE id = ?';
    db.query(query, [status, handledBy, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error updating promotion status' });
        
        if (status === 'Approved') {
            db.query('SELECT requested_grade, teacher_id FROM promotions WHERE id = ?', [id], (err, promoRes) => {
                if (promoRes && promoRes.length > 0) {
                    const gradeToSet = finalGrade || promoRes[0].requested_grade;
                    const userUpdateQuery = 'UPDATE users SET grade = ?, hourly_rate = ?, absence_penalty = ?, base_salary = ? WHERE id = ?';
                    db.query(userUpdateQuery, [gradeToSet, hourly_rate || 0, absence_penalty || 0, base_salary || 0, promoRes[0].teacher_id], (err) => {
                        if (err) console.error("Error updating user info after promotion:", err);
                    });
                }
            });
        }
        res.json({ message: `Promotion ${status.toLowerCase()}` });
    });
};
