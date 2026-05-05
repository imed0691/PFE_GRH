import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import './ManageApprovals.css';

function ManageApprovals({ user }) {
  const [documents, setDocuments] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resDocs, resProms] = await Promise.all([
        fetch('http://localhost:5000/api/documents', { headers }),
        fetch('http://localhost:5000/api/promotions', { headers })
      ]);

      if (resDocs.ok) {
        const data = await resDocs.json();
        const role = user.role.toUpperCase();
        
        // Filter based on who acts next
        let pendingDocs = [];
        if (role.includes('CHEF') || role.includes('HEAD')) {
          pendingDocs = data.filter(d => (d.status || '').toUpperCase().trim() === 'PENDING');
        } else if (role.includes('HR') || role.includes('RH')) {
          pendingDocs = data.filter(d => ['HEAD_APPROVED', 'PROCESSING'].includes((d.status || '').toUpperCase().trim()));
        } else if (['DEAN', 'DOYEN', 'RECTOR', 'RECTEUR'].some(r => role.includes(r))) {
          const isRector = ['RECTOR', 'RECTEUR', 'ADMIN'].some(r => role.includes(r));
          const isDean = ['DEAN', 'DOYEN', 'ADMIN'].some(r => role.includes(r));
          
          pendingDocs = data.filter(d => {
            const s = (d.status || '').toUpperCase().trim();
            if (s !== 'HR_APPROVED') return false;
            
            const type = (d.type || '').toLowerCase();
            // Rector Only
            if (type.includes('mission')) return isRector;
            // Dean Only
            if (type.includes('leave') || type.includes('congé') || type.includes('administrative') || type.includes('teaching')) return isDean;
            // Both
            return isRector || isDean;
          });
        } else if (role === 'ADMIN') {
          pendingDocs = data.filter(d => !['SIGNED', 'AVAILABLE', 'REJECTED'].includes((d.status || '').toUpperCase().trim()));
        }
        
        setDocuments(pendingDocs);
      }
      if (resProms.ok) {
        const data = await resProms.json();
        const role = user.role.toUpperCase();
        
        // Similarly for promotions (Status strings might vary, keeping it safe)
        setPromotions(data.filter(p => 
          (p.status || '').toUpperCase().includes('PENDING') || 
          (p.status || '').toUpperCase().includes('ATTENTE')
        ));
      }
    } catch (error) {
      toast.error(t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDocAction = async (doc, isApprove) => {
    try {
      const token = localStorage.getItem('token');
      const role = user.role.toUpperCase();
      const currentStatus = (doc.status || '').toUpperCase().trim();
      let nextStatus = 'REJECTED';

      if (isApprove) {
        if (currentStatus === 'PENDING') nextStatus = 'HEAD_APPROVED';
        else if (currentStatus === 'HR_APPROVED') nextStatus = 'SIGNED';
        else if (role === 'ADMIN') {
          // Admin override
          if (currentStatus === 'PENDING') nextStatus = 'HEAD_APPROVED';
          else if (currentStatus === 'HEAD_APPROVED') nextStatus = 'PROCESSING';
          else if (currentStatus === 'PROCESSING') nextStatus = 'HR_APPROVED';
          else if (currentStatus === 'HR_APPROVED') nextStatus = 'SIGNED';
        }
      }

      const res = await fetch(`http://localhost:5000/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        toast.success(isApprove ? 'Status Updated' : 'Document Rejected');
        fetchData();
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handlePromAction = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(status === 'Approved' ? 'Promotion Approved' : 'Promotion Rejected');
        fetchData();
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="loading-spinner-academic"></div>;

  return (
    <div className="approvals-container animate-mnadm">
      <div className="approvals-header">
        <h2 className="academic-title">{t('sidebar.approvals')}</h2>
        <p className="academic-subtitle">Review and validate pending requests from faculty staff</p>
      </div>

      <div className="approvals-grid">
        {/* Document Requests Section */}
        <section className="approval-section card-academic">
          <div className="section-header-pro">
            <div className="icon-badge-pro bg-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3>Document Requests ({documents.length})</h3>
          </div>
          
          <div className="approval-list">
            {documents.length === 0 ? (
              <div className="empty-state-pro">No pending documents</div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="approval-item-pro">
                  <div className="item-info">
                    <strong>{doc.user_name || 'Staff Member'}</strong>
                    <span>{doc.type}</span>
                    <small>{new Date(doc.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="item-actions">
                    <button className="btn-approve-mini" onClick={() => handleDocAction(doc, true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                    <button className="btn-reject-mini" onClick={() => handleDocAction(doc, false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Promotion Requests Section */}
        <section className="approval-section card-academic">
          <div className="section-header-pro bg-purple-tint">
            <div className="icon-badge-pro bg-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <h3>Promotion Files ({promotions.length})</h3>
          </div>

          <div className="approval-list">
            {promotions.length === 0 ? (
              <div className="empty-state-pro">No pending promotions</div>
            ) : (
              promotions.map(prom => (
                <div key={prom.id} className="approval-item-pro">
                  <div className="item-info">
                    <strong>{prom.user_name || 'Teacher'}</strong>
                    <span>Target: {prom.target_grade}</span>
                    <small>Submitted: {new Date(prom.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="item-actions">
                    <button className="btn-approve-mini" onClick={() => handlePromAction(prom.id, 'Approved')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                    <button className="btn-reject-mini" onClick={() => handlePromAction(prom.id, 'Rejected')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ManageApprovals;
