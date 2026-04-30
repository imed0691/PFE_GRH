import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

function ManageDocuments({ user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedType, setRequestedType] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [activeDocId, setActiveDocId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, isBulk: false });
  const { t, locale } = useLanguage();

  const fetchDocuments = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/documents', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setDocuments(await res.json()); } catch (error) { toast.error(t('documents.errorLoading')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleRequestDocument = async (e) => {
    e.preventDefault(); if (!requestedType) return;
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ type: requestedType }) });
      if (res.ok) { toast.success(t('documents.requestSubmitted')); setRequestedType(''); fetchDocuments(); } else { toast.error(t('documents.errorSubmitting')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { const token = localStorage.getItem('token'); const res = await fetch(`http://localhost:5000/api/documents/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status, response_note: responseNote }) });
      if (res.ok) { 
        toast.success(`${t('documents.requestMarkedAs')} ${status}`); 
        setActiveDocId(null); 
        setResponseNote(''); 
        fetchDocuments(); 
      } else { 
        toast.error(t('documents.errorUpdating')); 
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleDelete = async (id) => {
    setConfirmModal({ isOpen: true, id, isBulk: false });
  };

  const handleDeleteAll = () => {
    const processed = documents.filter(d => ['ready', 'rejected', 'delivered'].includes(d.status?.toLowerCase()));
    if (processed.length === 0) return toast.info(t('common.noData') || 'Aucune donnée à nettoyer');
    setConfirmModal({ isOpen: true, id: 'all_processed', isBulk: true });
  };

  const performDelete = async () => {
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/documents/${confirmModal.id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) { 
        toast.success(t('common.deleted') || 'Deleted'); 
        fetchDocuments(); 
      } else { 
        toast.error(t('common.errorDeleting')); 
      }
    } catch (error) { toast.error(t('common.serverError')); }
    setConfirmModal({ isOpen: false, id: null, isBulk: false });
  };

  const performBulkDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/documents/bulk-delete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t('absences.historyDeleted') || 'History cleared');
        fetchDocuments();
      } else {
        toast.error(t('common.errorDeleting'));
      }
    } catch (error) { toast.error(t('common.serverError')); }
    setConfirmModal({ isOpen: false, id: null, isBulk: false });
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const roleUpper = user.role?.toUpperCase() || '';
  const isAdmin = ['HR','RH','ADMIN','DEAN','DOYEN','RECTOR','CHEF'].some(r => roleUpper.includes(r));

  const translateDocType = (type) => {
    if (!type) return '-';
    const tLower = type.toLowerCase();
    if (tLower.includes('work certificate') || tLower.includes('travail')) return t('documents.workCert');
    if (tLower.includes('salary slip') || tLower.includes('paie')) return t('documents.salarySlip');
    if (tLower.includes('teaching load')) return t('documents.teachingLoad');
    if (tLower.includes('mission order') || tLower.includes('mission')) return t('documents.missionOrder');
    return type;
  };

  const translateStatus = (status) => {
    if (!status) return '-';
    if (status === 'Ready') return t('documents.ready');
    if (status === 'Delivered') {
      return isTeacher ? (t('documents.received') || 'Received') : (t('documents.delivered') || 'Delivered');
    }
    if (status === 'Processing') return t('documents.processing') || 'In Progress';
    if (status === 'Rejected') return t('absences.rejected') || 'Rejected';
    if (status === 'Pending') return t('absences.pending') || 'Pending';
    return status;
  };

  return (
    <>
      <div className="card-academic" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>{isTeacher ? t('documents.myRequests') : t('documents.allRequests') || t('documents.title')}</h3>
          {!isTeacher && isAdmin && documents.some(d => ['ready', 'rejected', 'delivered'].includes(d.status?.toLowerCase())) && (
            <button 
              onClick={handleDeleteAll}
              className="btn-delete-pro"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              {t('common.clearHistory') || 'Clear History'}
            </button>
          )}
        </div>
        {isTeacher && (
          <form onSubmit={handleRequestDocument} className="card-academic" style={{ marginBottom: '32px', background: 'var(--bg-main)', border: '1px solid var(--border-soft)' }}>
            <h4 style={{ margin: '0 0 24px 0', color: 'var(--secondary)', fontSize: '18px' }}>{t('documents.requestNew')}</h4>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="mnadm-label">{t('documents.docType')}</label>
                <select className="mnadm-input" value={requestedType} onChange={(e) => setRequestedType(e.target.value)} required>
                  <option value="">{t('documents.selectDocType')}</option>
                  <option value="Work Certificate (Attestation de travail)">{t('documents.workCert')}</option>
                  <option value="Salary Slip (Fiche de paie)">{t('documents.salarySlip')}</option>
                  <option value="Teaching Load Certificate">{t('documents.teachingLoad')}</option>
                  <option value="Mission Order (Ordre de mission)">{t('documents.missionOrder')}</option>
                </select>
              </div>
              <button type="submit" className="btn-confirm-pro" style={{ padding: '14px 32px' }}>{t('documents.submitRequest')}</button>
            </div>
          </form>
        )}
        {loading ? <div className="loading-spinner">{t('documents.loadingRequests')}</div> : (
          <div className="modern-table-wrapper">
            <table className="modern-table">
              <thead><tr><th>#</th><th>{t('common.date')}</th>{!isTeacher && <th>{t('common.teacher')}</th>}<th>{t('documents.docType')}</th><th>{t('common.status')}</th><th style={{ textAlign: 'center' }}>{t('common.actions')}</th></tr></thead>
              <tbody>
                {documents.map((d, index) => (
                  <tr key={d.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(d.request_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}</td>
                    {!isTeacher && (
                      <td>
                        <strong>{d.nom}</strong> {d.prenom}<br/>
                        <small style={{color: 'var(--text-muted)'}}>
                          {d.department_name && d.department_name !== 'null' ? (
                            (() => {
                              const dept = d.department_name.trim();
                              const translated = t('departments.' + dept);
                              return translated === 'departments.' + dept ? dept : translated;
                            })()
                          ) : '-'}
                        </small>
                      </td>
                    )}
                    <td><strong>{translateDocType(d.type)}</strong></td>
                    <td>
                      <span className={`badge-pro ${d.status === 'Ready' || d.status === 'Delivered' ? 'badge-pro-success' : d.status === 'Rejected' ? 'badge-pro-danger' : 'badge-pro-warning'}`}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {(d.status === 'Ready' || d.status === 'Delivered') && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          {(d.status === 'Processing' || d.status === 'Pending') && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
                          {translateStatus(d.status)}
                        </span>
                      </span>
                    </td>
                    <td>
                      {isTeacher && d.status?.toLowerCase() === 'ready' && (
                        <button 
                          onClick={() => handleStatusUpdate(d.id, 'Delivered')} 
                          className="btn-confirm-pro" 
                          style={{ padding: '8px 16px', fontSize: '12px' }}
                        >
                          {t('documents.confirmReceipt')}
                        </button>
                      )}
                      {!isTeacher && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          {!['ready', 'rejected', 'delivered'].includes(d.status?.toLowerCase()) ? (
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                              <button onClick={() => setActiveDocId(d.id)} className="btn-confirm-pro" style={{ padding: '8px 16px', fontSize: '12px', flex: 1 }}>{t('documents.processRequest')}</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                              <button 
                                onClick={() => handleDelete(d.id)} 
                                className="btn-delete-pro" 
                                title={t('common.delete')}
                                style={{ padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && <tr><td colSpan={isTeacher ? 4 : 6} className="empty-state-cell">{t('documents.noRequests')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeDocId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div className="custom-modal-card animate-mnadm" style={{ width: '100%', maxWidth: '480px', padding: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>{t('documents.processRequest')}</h3>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px', lineHeight: '1.5' }}>{t('documents.processingInstruction') || 'Update status and add a note for the teacher'}</p>
            
            <div className="mnadm-form-group" style={{ marginBottom: '32px', textAlign: 'left' }}>
              <label className="mnadm-label">{t('documents.adminNote')}</label>
              <textarea 
                className="mnadm-input" 
                placeholder={t('documents.notePlaceholder') || "e.g. Your document is ready at the HR office"}
                value={responseNote} 
                onChange={(e) => setResponseNote(e.target.value)} 
                rows="4"
                style={{ padding: '16px', borderRadius: '16px', fontSize: '14px', border: '1px solid var(--border)' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleStatusUpdate(activeDocId, 'Processing')} className="custom-modal-btn btn-confirm" style={{ background: '#f59e0b', borderRadius: '100px', flex: 1 }}>
                  {t('documents.markProcessing')}
                </button>
                <button onClick={() => handleStatusUpdate(activeDocId, 'Ready')} className="custom-modal-btn btn-confirm" style={{ background: 'var(--p-indigo)', borderRadius: '100px', flex: 1 }}>
                  {t('documents.ready')}
                </button>
              </div>
              <button onClick={() => { setActiveDocId(null); setResponseNote(''); }} className="custom-modal-btn btn-cancel" style={{ borderRadius: '100px', border: '1px solid var(--border)', background: 'transparent', width: '100%' }}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        message={confirmModal.isBulk ? (t('common.confirmClearAll') || 'Voulez-vous supprimer tout l\'historique traité ?') : t('common.confirmDelete')}
        onConfirm={confirmModal.isBulk ? performBulkDelete : performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </>
  );
}

export default ManageDocuments;
