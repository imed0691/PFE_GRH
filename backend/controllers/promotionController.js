const db = require('../config/db');

exports.requestPromotion = (req, res) => {
    const teacherId = req.user.id;
    const { requested_grade } = req.body;

    if (!requested_grade) {
        return res.status(400).json({ message: 'Requested grade is required' });
    }

    const gradeHierarchy = ['Teacher', 'MAB', 'MAA', 'MCB', 'MCA', 'Professeur'];

    db.query('SELECT grade FROM users WHERE id = ?', [teacherId], (err, userResults) => {
        if (err || userResults.length === 0) {
            console.error("[PromotionRequest] Error fetching current grade:", err);
            return res.status(500).json({ message: 'Error fetching current grade', error: err });
        }

        const current_grade = userResults[0].grade || 'Teacher';
        
        const currentIndex = gradeHierarchy.findIndex(g => g.toUpperCase() === current_grade.toUpperCase());
        const requestedIndex = gradeHierarchy.findIndex(g => g.toUpperCase() === requested_grade.toUpperCase());

        if (currentIndex === -1) {
            return res.status(400).json({ message: 'Grade actuel non reconnu.' });
        }
        if (requestedIndex === -1) {
            return res.status(400).json({ message: 'Grade demandé non reconnu.' });
        }

        if (requestedIndex <= currentIndex) {
            return res.status(400).json({ message: 'Promotion uniquement.' });
        }

        const filePath = req.file ? req.file.filename : null;
        
        // Initial status: Submitted
        const query = 'INSERT INTO `promotions` (`teacher_id`, `current_grade`, `requested_grade`, `file_path`, `status`) VALUES (?, ?, ?, ?, "Submitted")';
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

        // Filtering based on current workflow step
        if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
            db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
                if (err || deptRes.length === 0) return res.json([]);
                const headDeptId = deptRes[0].department_id;
                return res.json(results.filter(p => p.department_id === headDeptId && p.status === 'Submitted'));
            });
            return;
        }

        if (userRole === 'VICE_DEAN' || userRole === 'VICE_DOYEN') {
            return res.json(results.filter(p => p.status === 'Head Approved'));
        }

        if (userRole === 'DEAN' || userRole === 'DOYEN') {
            return res.json(results.filter(p => p.status === 'Pre-validated'));
        }

        if (userRole === 'HR' || userRole === 'RH' || userRole === 'HR_MANAGER' || userRole === 'RH_MANAGER') {
            return res.json(results.filter(p => p.status === 'Dean Validated' || ['HR Processed', 'Vice Rector Approved', 'Final Approved', 'Promoted', 'Rejected'].includes(p.status)));
        }

        if (userRole === 'VICE_RECTOR' || userRole === 'VICE_RECTEUR') {
            return res.json(results.filter(p => p.status === 'HR Processed'));
        }

        if (userRole === 'RECTOR' || userRole === 'RECTEUR') {
            return res.json(results.filter(p => p.status === 'Vice Rector Approved'));
        }

        res.json(results);
    });
};

exports.recommendPromotion = (req, res) => {
    const { id } = req.params;
    const { recommendation, evaluation_score } = req.body;
    const userRole = req.user.role;

    let nextStatus = '';
    let rolePrefix = '';

    if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
        nextStatus = 'Head Approved';
        rolePrefix = 'Chef Dépt';
    } else if (userRole === 'VICE_DEAN' || userRole === 'VICE_DOYEN') {
        nextStatus = 'Pre-validated';
        rolePrefix = 'Vice-Doyen';
    } else if (userRole === 'DEAN' || userRole === 'DOYEN') {
        nextStatus = 'Dean Validated';
        rolePrefix = 'Doyen';
    } else if (userRole === 'HR' || userRole === 'RH' || userRole === 'HR_MANAGER' || userRole === 'RH_MANAGER') {
        nextStatus = 'HR Processed';
        rolePrefix = 'RH';
    } else if (userRole === 'VICE_RECTOR' || userRole === 'VICE_RECTEUR') {
        nextStatus = 'Vice Rector Approved';
        rolePrefix = 'Vice-Recteur';
    } else {
        return res.status(403).json({ message: 'Unauthorized to recommend' });
    }

    const newRecText = `${rolePrefix}: ${recommendation}`;
    
    // Update score only if provided (typically by Vice Dean)
    const updateScorePart = evaluation_score !== undefined ? ', evaluation_score = ?' : '';
    const queryParams = [newRecText, newRecText, nextStatus];
    if (evaluation_score !== undefined) queryParams.push(evaluation_score);
    queryParams.push(id);

    const query = `
        UPDATE promotions 
        SET dept_head_recommendation = CASE 
            WHEN dept_head_recommendation IS NULL OR dept_head_recommendation = '' THEN ? 
            ELSE CONCAT(dept_head_recommendation, '\n', ?) 
        END, 
        status = ? 
        ${updateScorePart}
        WHERE id = ?`;
        
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error("Error recommending promotion:", err);
            return res.status(500).json({ message: 'Error recommending promotion' });
        }
        res.json({ message: `Promotion sent to next level: ${nextStatus}` });
    });
};

exports.approveRejectPromotion = (req, res) => {
    const { id } = req.params;
    const { status, finalGrade, hourly_rate, absence_penalty, base_salary } = req.body; 
    const handledBy = req.user.id;
    const userRole = req.user.role;

    // Only Rector can Finalize to 'Promoted'
    // Other roles use recommendPromotion to move forward
    // But Rector can also 'Reject'

    if (userRole !== 'RECTOR' && userRole !== 'RECTEUR' && status !== 'Rejected') {
        return res.status(403).json({ message: 'Only Rector can finalize promotion' });
    }

    const finalStatus = (status === 'Approved') ? 'Promoted' : status;

    const query = 'UPDATE promotions SET status = ?, handled_by = ?, handling_date = NOW() WHERE id = ?';
    db.query(query, [finalStatus, handledBy, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error updating promotion status' });
        
        if (finalStatus === 'Promoted') {
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
        res.json({ message: `Promotion ${finalStatus}` });
    });
};

