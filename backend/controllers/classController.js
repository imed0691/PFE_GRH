const db = require('../config/db');

// --- STUDY LEVELS ---
exports.getStudyLevels = (req, res) => {
    let { department_id } = req.query;
    
    // Security: Chef de Departement can only see his own
    if (req.user.role === 'CHEF_DEPARTEMENT' || req.user.role === 'DEPARTMENT_HEAD') {
        department_id = req.user.department_id;
    }

    let query = 'SELECT * FROM study_levels';
    let params = [];

    if (department_id) {
        query += ' WHERE department_id = ?';
        params.push(department_id);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createStudyLevel = (req, res) => {
    let { name, department_id } = req.body;
    
    // Security: Forced department for Dept Head
    if (req.user.role === 'CHEF_DEPARTEMENT' || req.user.role === 'DEPARTMENT_HEAD') {
        department_id = req.user.department_id;
    }

    if (!name || !department_id) return res.status(400).json({ message: "Le nom et le département sont requis." });

    const query = 'INSERT INTO study_levels (name, department_id) VALUES (?, ?)';
    db.query(query, [name, department_id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ id: results.insertId, name, department_id });
    });
};

exports.deleteStudyLevel = (req, res) => {
    const { id } = req.params;
    
    // Check ownership before delete if Dept Head
    if (req.user.role === 'CHEF_DEPARTEMENT' || req.user.role === 'DEPARTMENT_HEAD') {
        const checkQuery = 'SELECT department_id FROM study_levels WHERE id = ?';
        db.query(checkQuery, [id], (err, results) => {
            if (results.length > 0 && results[0].department_id !== req.user.department_id) {
                return res.status(403).json({ message: "Accès refusé : Ce niveau ne vous appartient pas." });
            }
            performDelete();
        });
    } else {
        performDelete();
    }

    function performDelete() {
        db.query('DELETE FROM study_levels WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Niveau d'étude supprimé avec succès." });
        });
    }
};

// --- SECTIONS ---
exports.getSections = (req, res) => {
    const { study_level_id } = req.query;
    let query = 'SELECT * FROM sections';
    let params = [];

    if (study_level_id) {
        query += ' WHERE study_level_id = ?';
        params.push(study_level_id);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createSection = (req, res) => {
    const { name, study_level_id } = req.body;
    if (!name || !study_level_id) return res.status(400).json({ message: "Le nom et le niveau d'étude sont requis." });

    const query = 'INSERT INTO sections (name, study_level_id) VALUES (?, ?)';
    db.query(query, [name, study_level_id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ id: results.insertId, name, study_level_id });
    });
};

exports.deleteSection = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM sections WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Section supprimée avec succès." });
    });
};

// --- STUDENT GROUPS ---
exports.getStudentGroups = (req, res) => {
    const { section_id } = req.query;
    let query = 'SELECT * FROM student_groups';
    let params = [];

    if (section_id) {
        query += ' WHERE section_id = ?';
        params.push(section_id);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createStudentGroup = (req, res) => {
    const { name, section_id } = req.body;
    if (!name || !section_id) return res.status(400).json({ message: "Le nom et la section sont requis." });

    const query = 'INSERT INTO student_groups (name, section_id) VALUES (?, ?)';
    db.query(query, [name, section_id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ id: results.insertId, name, section_id });
    });
};

exports.deleteStudentGroup = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM student_groups WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Groupe supprimé avec succès." });
    });
};

// --- MODULES ---
exports.getModules = (req, res) => {
    let { department_id, study_level_id } = req.query;
    
    if (req.user.role === 'CHEF_DEPARTEMENT' || req.user.role === 'DEPARTMENT_HEAD') {
        department_id = req.user.department_id;
    }

    let query = 'SELECT * FROM modules WHERE 1=1';
    let params = [];

    if (department_id) {
        query += ' AND department_id = ?';
        params.push(department_id);
    }
    if (study_level_id) {
        query += ' AND study_level_id = ?';
        params.push(study_level_id);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createModule = (req, res) => {
    let { name, study_level_id, department_id } = req.body;
    
    if (req.user.role === 'CHEF_DEPARTEMENT' || req.user.role === 'DEPARTMENT_HEAD') {
        department_id = req.user.department_id;
    }

    if (!name || !study_level_id || !department_id) return res.status(400).json({ message: "Champs requis manquants." });

    const query = 'INSERT INTO modules (name, study_level_id, department_id) VALUES (?, ?, ?)';
    db.query(query, [name, study_level_id, department_id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ id: results.insertId, name, study_level_id, department_id });
    });
};

exports.deleteModule = (req, res) => {
    const { id } = req.params;

    if (req.user.role === 'CHEF_DEPARTEMENT' || req.user.role === 'DEPARTMENT_HEAD') {
        const checkQuery = 'SELECT department_id FROM modules WHERE id = ?';
        db.query(checkQuery, [id], (err, results) => {
            if (results.length > 0 && results[0].department_id !== req.user.department_id) {
                return res.status(403).json({ message: "Accès refusé : Ce module ne vous appartient pas." });
            }
            performDelete();
        });
    } else {
        performDelete();
    }

    function performDelete() {
        db.query('DELETE FROM modules WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Module supprimé." });
        });
    }
};

// --- TEACHER MODULES ---
exports.getTeacherModules = (req, res) => {
    const { teacher_id } = req.query;
    const query = `
        SELECT m.id, m.name, m.study_level_id, sl.name as study_level, d.name as department
        FROM teacher_modules tm
        JOIN modules m ON tm.module_id = m.id
        JOIN study_levels sl ON m.study_level_id = sl.id
        JOIN departments d ON m.department_id = d.id
        WHERE tm.teacher_id = ?
    `;
    db.query(query, [teacher_id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.assignModule = (req, res) => {
    const { teacher_id, module_id } = req.body;

    // Security: Check if both teacher and module belong to the same department as the Chef
    if (req.user.role === 'CHEF_DEPARTEMENT' || req.user.role === 'DEPARTMENT_HEAD') {
        const checkQuery = `
            SELECT 
                (SELECT department_id FROM users WHERE id = ?) as teacher_dept,
                (SELECT department_id FROM modules WHERE id = ?) as module_dept
        `;
        db.query(checkQuery, [teacher_id, module_id], (err, results) => {
            const { teacher_dept, module_dept } = results[0];
            if (teacher_dept !== req.user.department_id || module_dept !== req.user.department_id) {
                return res.status(403).json({ message: "Accès refusé : Vous ne pouvez assigner que des profs/modules de votre département." });
            }
            performAssign();
        });
    } else {
        performAssign();
    }

    function performAssign() {
        const query = 'INSERT INTO teacher_modules (teacher_id, module_id) VALUES (?, ?)';
        db.query(query, [teacher_id, module_id], (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Déjà assigné." });
                return res.status(500).json({ message: err.message });
            }
            res.status(201).json({ message: "Module assigné." });
        });
    }
};

exports.unassignModule = (req, res) => {
    const { teacher_id, module_id } = req.query;
    const query = 'DELETE FROM teacher_modules WHERE teacher_id = ? AND module_id = ?';
    db.query(query, [teacher_id, module_id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Module désassigné." });
    });
};
