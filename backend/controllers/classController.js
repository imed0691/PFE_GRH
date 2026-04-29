const db = require('../config/db');

// --- STUDY LEVELS ---
exports.getStudyLevels = (req, res) => {
    const { department_id } = req.query;
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
    const { name, department_id } = req.body;
    if (!name || !department_id) return res.status(400).json({ message: "Le nom et le département sont requis." });

    const query = 'INSERT INTO study_levels (name, department_id) VALUES (?, ?)';
    db.query(query, [name, department_id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ id: results.insertId, name, department_id });
    });
};

exports.deleteStudyLevel = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM study_levels WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Niveau d'étude supprimé avec succès." });
    });
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
    const { department_id, study_level_id } = req.query;
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
    const { name, study_level_id, department_id } = req.body;
    if (!name || !study_level_id || !department_id) return res.status(400).json({ message: "Champs requis manquants." });

    const query = 'INSERT INTO modules (name, study_level_id, department_id) VALUES (?, ?, ?)';
    db.query(query, [name, study_level_id, department_id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ id: results.insertId, name, study_level_id, department_id });
    });
};

exports.deleteModule = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM modules WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Module supprimé." });
    });
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
    const query = 'INSERT INTO teacher_modules (teacher_id, module_id) VALUES (?, ?)';
    db.query(query, [teacher_id, module_id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Déjà assigné." });
            return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: "Module assigné." });
    });
};

exports.unassignModule = (req, res) => {
    const { teacher_id, module_id } = req.query;
    const query = 'DELETE FROM teacher_modules WHERE teacher_id = ? AND module_id = ?';
    db.query(query, [teacher_id, module_id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Module désassigné." });
    });
};
