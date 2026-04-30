const db = require('../config/db');

exports.requestDocument = (req, res) => {
    const teacherId = req.user.id;
    const { type } = req.body;

    if (!type) {
        return res.status(400).json({ message: "Document type is required." });
    }

    const query = "INSERT INTO documents (teacher_id, type, status) VALUES (?, ?, 'Processing')";
    db.query(query, [teacherId, type], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error submitting document request' });
        res.status(201).json({ message: 'Document requested successfully', id: results.insertId });
    });
};

exports.getAllDocuments = (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
        SELECT d.id, d.teacher_id, d.type, d.status, d.request_date, d.response_note,
               u.nom, u.prenom, u.department_id, dept.name AS department_name
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

        // HR Manager and Admins/Rectors see everything
        const roleUpper = userRole.toUpperCase();
        if (roleUpper.includes('HR') || roleUpper.includes('RH') || roleUpper.includes('ADMIN') || roleUpper.includes('RECTOR')) {
            return res.json(results);
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

        // Fallback: everyone else sees only their own (even if they have a role like Dean but are viewing their personal space)
        res.json(results.filter(d => d.teacher_id === userId));
    });
};

exports.updateDocumentStatus = (req, res) => {
    const { id } = req.params;
    const { status, response_note } = req.body;
    const handledBy = req.user.id;
    const userRole = req.user.role;

    db.query('SELECT type, teacher_id FROM documents WHERE id = ?', [id], (err, docRes) => {
        if (err || docRes.length === 0) return res.status(404).json({ message: 'Document not found' });
        
        const docType = docRes[0].type.toLowerCase();
        
        let authorized = false;
        const roleUpper = userRole.toUpperCase();
        
        // Teachers can ONLY mark their own documents as 'Delivered'
        if (roleUpper.includes('TEACHER') || roleUpper.includes('ENSEIGNANT')) {
            const docOwnerId = docRes[0].teacher_id;
            if (req.user.id === docOwnerId && req.body.status === 'Delivered') {
                authorized = true;
            }
        } 
        // Managers can mark documents as Ready/Processing
        else if (roleUpper.includes('DEAN') || roleUpper.includes('DOYEN')) {
            if (docType.includes('work') || docType.includes('travail') || docType.includes('mission')) authorized = true;
        } else if (roleUpper.includes('CHEF') || roleUpper.includes('DEPARTMENT')) {
            if (docType.includes('teaching') || docType.includes('charge')) authorized = true;
        } else if (roleUpper.includes('HR') || roleUpper.includes('RH') || roleUpper.includes('RECTOR') || roleUpper.includes('RECTEUR') || roleUpper.includes('ADMIN')) {
            authorized = true;
        }

        if (!authorized) {
            console.warn(`Unauthorized attempt: Role=${userRole}, DocType=${docType}`);
            return res.status(403).json({ message: 'Accès refusé pour ce type de document' });
        }

        const finalStatus = req.body.status || 'Ready';
        const query = "UPDATE documents SET status = ?, response_note = ?, handled_by = ? WHERE id = ?";
        db.query(query, [finalStatus, req.body.response_note || null, handledBy, id], (err, results) => {
            if (err) {
                console.error('Error updating document status:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            res.json({ message: 'Status updated', status: finalStatus });
        });
    });
};

exports.deleteDocument = (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const isAdmin = ['HR','RH','ADMIN','DEAN','DOYEN','RECTOR','RECTEUR'].some(r => userRole.includes(r));
    
    if (!isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    db.query('DELETE FROM documents WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error deleting document' });
        res.json({ message: 'Document deleted successfully' });
    });
};

exports.bulkDeleteDocuments = (req, res) => {
    const userRole = req.user.role;
    const isAdmin = ['HR','RH','ADMIN'].some(r => userRole.includes(r));
    
    if (!isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    const query = "DELETE FROM documents WHERE status IN ('Delivered', 'Rejected')";
    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error deleting history' });
        res.json({ message: 'History cleared successfully' });
    });
};
