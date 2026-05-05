const db = require('../config/db');

// Map document types to their required signing authority
const getAuthorityForType = (type) => {
    const t = type.toLowerCase();
    if (t.includes('work') || t.includes('salary') || t.includes('paie') || t.includes('travail')) return 'HR_MANAGER';
    if (t.includes('leave') || t.includes('congé') || t.includes('administrative')) return 'DEAN';
    if (t.includes('mission')) return 'VICE_RECTOR';
    return 'HR_MANAGER'; // Default
};

exports.requestDocument = (req, res) => {
    const teacherId = req.user.id;
    const { type, note } = req.body;

    if (!type) return res.status(400).json({ message: "Document type is required." });

    const authority = getAuthorityForType(type);
    const query = "INSERT INTO documents (teacher_id, type, status, response_note, authority_role) VALUES (?, ?, 'Pending', ?, ?)";
    
    db.query(query, [teacherId, type, note || null, authority], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error submitting document request' });
        res.status(201).json({ message: 'Document requested successfully', id: results.insertId });
    });
};

exports.getAllDocuments = (req, res) => {
    const userRole = req.user.role?.toUpperCase() || '';
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

        // Teachers see their own
        if (userRole.includes('TEACHER') || userRole.includes('ENSEIGNANT')) {
            return res.json(results.filter(d => d.teacher_id === userId));
        }

        // Head of Department sees their department's PENDING requests
        if (userRole.includes('DEPARTMENT_HEAD') || userRole.includes('CHEF_DEPARTEMENT')) {
            db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
                if (err || deptRes.length === 0) return res.json([]);
                const headDeptId = deptRes[0].department_id;
                return res.json(results.filter(d => d.department_id === headDeptId));
            });
            return;
        }

        // HR, Dean, Rector or ADMIN see everything
        const allAccessRoles = ['HR', 'RH', 'ADMIN', 'DEAN', 'DOYEN', 'RECTOR', 'RECTEUR', 'VICE_DEAN', 'VICE_RECTOR'];
        if (allAccessRoles.some(role => userRole.includes(role))) {
            return res.json(results);
        }

        return res.json([]);

        // Authorities (Dean, Vice-Rector) see requests waiting for their signature
        if (userRole.includes('DEAN') || userRole.includes('DOYEN') || userRole.includes('RECTOR') || userRole.includes('RECTEUR')) {
            return res.json(results.filter(d => d.authority_role === userRole || d.authority_role.includes(userRole)));
        }

        res.json(results.filter(d => d.teacher_id === userId));
    });
};

exports.updateDocumentStatus = (req, res) => {
    const { id } = req.params;
    const { status: nextStatus, response_note, pdf_path } = req.body;
    const userRole = req.user.role?.toUpperCase() || '';
    const userId = req.user.id;

    // VALID STATUS ENUM
    const VALID_STATUSES = ["PENDING", "HEAD_APPROVED", "PROCESSING", "HR_APPROVED", "SIGNED", "AVAILABLE", "REJECTED"];
    if (!VALID_STATUSES.includes(nextStatus)) {
        return res.status(400).json({ message: "Invalid status transition" });
    }

    db.query('SELECT * FROM documents WHERE id = ?', [id], (err, docRes) => {
        if (err || docRes.length === 0) {
            console.error("[DEBUG] Doc not found or query error:", err);
            return res.status(404).json({ message: 'Document not found' });
        }
        
        const doc = docRes[0];
        const currentStatus = (doc.status || 'PENDING').toUpperCase().trim();
        let authorized = false;

        console.log(`[DEBUG] Updating Doc ${id}: ${currentStatus} -> ${nextStatus} | Role: ${userRole}`);

        // --- STRICT TRANSITION RULES ---
        
        // 1. PENDING -> HEAD_APPROVED or REJECTED (Dept Head)
        if (currentStatus === 'PENDING') {
            if (['HEAD_APPROVED', 'REJECTED'].includes(nextStatus)) {
                if (userRole.includes('CHEF') || userRole.includes('HEAD') || userRole.includes('ADMIN')) authorized = true;
            }
            // HR can also approve HR-authority docs directly
            if (nextStatus === 'PROCESSING' && (userRole.includes('HR') || userRole.includes('RH') || userRole.includes('ADMIN'))) {
                authorized = true;
            }
        }

        // 2. HEAD_APPROVED -> PROCESSING (HR Manager)
        if (currentStatus === 'HEAD_APPROVED' && nextStatus === 'PROCESSING') {
            if (userRole.includes('HR') || userRole.includes('RH') || userRole.includes('ADMIN')) authorized = true;
        }

        // 3. PROCESSING -> HR_APPROVED (HR Manager)
        if (currentStatus === 'PROCESSING' && nextStatus === 'HR_APPROVED') {
            if (userRole.includes('HR') || userRole.includes('RH') || userRole.includes('ADMIN')) authorized = true;
        }

        // 4. HR_APPROVED -> SIGNED (Authority Signature)
        if (currentStatus === 'HR_APPROVED' && nextStatus === 'SIGNED') {
            const docType = (doc.type || '').toLowerCase();
            const isRector = ['RECTOR', 'RECTEUR', 'ADMIN'].some(r => userRole.includes(r));
            const isDean = ['DEAN', 'DOYEN', 'ADMIN'].some(r => userRole.includes(r));

            // Policy:
            // Rector Only: Mission Order
            if (docType.includes('mission')) {
                if (isRector) authorized = true;
            }
            // Dean Only: Leave Request, Admin Certificate, Teaching Load
            else if (docType.includes('leave') || docType.includes('congé') || docType.includes('administrative') || docType.includes('teaching')) {
                if (isDean) authorized = true;
            }
            // Both: Work Certificate, Salary Certificate
            else if (docType.includes('work') || docType.includes('salary') || docType.includes('paie') || docType.includes('travail')) {
                if (isRector || isDean) authorized = true;
            }
            // Default: Both for safety
            else {
                if (isRector || isDean) authorized = true;
            }
        }

        // 5. SIGNED -> AVAILABLE (Teacher/Collector)
        if (currentStatus === 'SIGNED' && nextStatus === 'AVAILABLE') {
            if (doc.teacher_id === userId || userRole.includes('ADMIN')) authorized = true;
        }

        // Global Reject (HR can reject at processing)
        if (['HEAD_APPROVED', 'PROCESSING'].includes(currentStatus) && nextStatus === 'REJECTED') {
            if (userRole.includes('HR') || userRole.includes('RH') || userRole.includes('ADMIN')) authorized = true;
        }

        // Allow same-status updates (to save notes/remarks)
        if (currentStatus === nextStatus) {
            if (userRole.includes('CHEF') || userRole.includes('HEAD') || userRole.includes('HR') || userRole.includes('RH') || userRole.includes('ADMIN')) authorized = true;
        }

        if (!authorized) {
            return res.status(403).json({ 
                message: `Invalid transition: Cannot move from ${currentStatus} to ${nextStatus} with your role.` 
            });
        }

        const query = "UPDATE documents SET status = ?, response_note = ?, pdf_path = ?, handled_by = ? WHERE id = ?";
        db.query(query, [nextStatus, response_note || doc.response_note, pdf_path || doc.pdf_path, userId, id], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating document status' });
            res.json({ message: 'Status updated successfully', newStatus: nextStatus });
        });
    });
};

exports.deleteDocument = (req, res) => {
    const { id } = req.params;
    const isAdmin = ['HR','RH','ADMIN','RECTOR'].some(r => req.user.role?.toUpperCase().includes(r));
    if (!isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    db.query('DELETE FROM documents WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ message: 'Error deleting document' });
        res.json({ message: 'Document deleted successfully' });
    });
};

exports.bulkDeleteDocuments = (req, res) => {
    const isAdmin = ['HR','RH','ADMIN'].some(r => req.user.role?.toUpperCase().includes(r));
    if (!isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    const query = "DELETE FROM documents WHERE status IN ('Available', 'Rejected')";
    db.query(query, (err) => {
        if (err) return res.status(500).json({ message: 'Error deleting history' });
        res.json({ message: 'History cleared successfully' });
    });
};
