const db = require('../config/db');

exports.requestDocument = (req, res) => {
    const teacherId = req.user.id;
    const { type } = req.body;

    if (!type) {
        return res.status(400).json({ message: "Document type is required." });
    }

    const query = 'INSERT INTO documents (teacher_id, type) VALUES (?, ?)';
    db.query(query, [teacherId, type], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error submitting document request' });
        res.status(201).json({ message: 'Document requested successfully', id: results.insertId });
    });
};

exports.getAllDocuments = (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
        SELECT d.*, u.nom, u.prenom, u.department_id, dept.name AS department_name
        FROM documents d
        JOIN users u ON d.teacher_id = u.id
        LEFT JOIN departments dept ON u.department_id = dept.id
        ORDER BY d.request_date DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching documents' });

        if (userRole === 'TEACHER' || userRole === 'ENSEIGNANT') {
            return res.json(results.filter(d => d.teacher_id === userId));
        }

        if (userRole === 'DEAN' || userRole === 'DOYEN') {
            return res.json(results.filter(d => 
                d.type === 'Work Certificate (Attestation de travail)' || 
                d.type === 'Mission Order (Ordre de mission)'
            ));
        }

        if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
            db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
                if (err || deptRes.length === 0) return res.json([]);
                const headDeptId = deptRes[0].department_id;
                return res.json(results.filter(d => 
                    d.department_id === headDeptId && 
                    d.type === 'Teaching Load Certificate'
                ));
            });
            return;
        }

        if (userRole === 'HR' || userRole === 'RH' || userRole === 'HR_MANAGER' || userRole === 'RH_MANAGER') {
            return res.json(results.filter(d => 
                d.type === 'Salary Slip (Fiche de paie)'
            ));
        }

        // Rectors/Admins see all for overview
        res.json(results);
    });
};

exports.updateDocumentStatus = (req, res) => {
    const { id } = req.params;
    const { status, response_note } = req.body;
    const handledBy = req.user.id;
    const userRole = req.user.role;

    db.query('SELECT type FROM documents WHERE id = ?', [id], (err, docRes) => {
        if (err || docRes.length === 0) return res.status(404).json({ message: 'Document not found' });
        
        const docType = docRes[0].type;
        
        let authorized = false;
        if (userRole === 'DEAN' || userRole === 'DOYEN') {
            if (docType === 'Work Certificate (Attestation de travail)' || docType === 'Mission Order (Ordre de mission)') authorized = true;
        } else if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
            if (docType === 'Teaching Load Certificate') authorized = true;
        } else if (userRole === 'HR' || userRole === 'RH' || userRole === 'HR_MANAGER' || userRole === 'RH_MANAGER') {
            if (docType === 'Salary Slip (Fiche de paie)') authorized = true;
        } else if (userRole === 'RECTOR' || userRole === 'RECTEUR' || userRole === 'ADMIN') {
            authorized = true;
        }

        if (!authorized) {
            return res.status(403).json({ message: 'Unauthorized to process this document type' });
        }

        const query = 'UPDATE documents SET status = ?, response_note = ?, handled_by = ? WHERE id = ?';
        db.query(query, [status, response_note || null, handledBy, id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error updating document status' });
            res.json({ message: `Document status updated to ${status}` });
        });
    });
};
