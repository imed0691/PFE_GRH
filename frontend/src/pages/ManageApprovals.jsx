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
        // Filter for pending documents
        setDocuments(data.filter(d => d.status === 'Pending' || d.status === 'En attente'));
      }
      if (resProms.ok) {
        const data = await resProms.json();
        // Filter for pending promotions
        setPromotions(data.filter(p => p.status === 'Pending' || p.status === 'En attente'));
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

  const handleDocAction = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(status === 'Approved' ? 'Document Approved' : 'Document Rejected');
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
                    <button className="btn-approve-mini" onClick={() => handleDocAction(doc.id, 'Approved')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                    <button className="btn-reject-mini" onClick={() => handleDocAction(doc.id, 'Rejected')}>
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
