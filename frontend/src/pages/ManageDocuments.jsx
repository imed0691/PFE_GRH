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
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{isTeacher ? t('documents.myRequests') : t('documents.allRequests') || t('documents.title')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('documents.manageTitle') || 'Suivez et gérez les demandes de documents administratifs'}</p>
          </div>
          {!isTeacher && isAdmin && documents.some(d => ['ready', 'rejected', 'delivered'].includes(d.status?.toLowerCase())) && (
            <button 
              onClick={handleDeleteAll}
              className="btn-delete-pro"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', borderRadius: '12px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              {t('common.clearHistory') || 'Vider l\'historique'}
            </button>
          )}
        </div>

        {isTeacher && (
          <form onSubmit={handleRequestDocument} className="card-academic" style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--p-indigo)', color: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>+</div>
              <h4 className="serif" style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>{t('documents.requestNew')}</h4>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label className="mnadm-label">{t('documents.docType')}</label>
                <select className="mnadm-input" value={requestedType} onChange={(e) => setRequestedType(e.target.value)} required style={{ fontWeight: '700' }}>
                  <option value="">{t('documents.selectDocType')}</option>
                  <option value="Work Certificate (Attestation de travail)">{t('documents.workCert')}</option>
                  <option value="Salary Slip (Fiche de paie)">{t('documents.salarySlip')}</option>
                  <option value="Teaching Load Certificate">{t('documents.teachingLoad')}</option>
                  <option value="Mission Order (Ordre de mission)">{t('documents.missionOrder')}</option>
                </select>
              </div>
              <button type="submit" className="btn-confirm-pro" style={{ padding: '16px 40px', borderRadius: '14px', fontSize: '15px', fontWeight: '800' }}>{t('documents.submitRequest').toUpperCase()}</button>
            </div>
          </form>
        )}

        {loading ? <div className="loading-spinner" style={{ padding: '40px' }}>{t('documents.loadingRequests')}</div> : (
          <div className="modern-table-wrapper" style={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <table className="modern-table">
              <thead><tr><th style={{ width: '60px' }}>#</th><th>{t('common.date')}</th>{!isTeacher && <th>{t('common.teacher')}</th>}<th>{t('documents.docType')}</th><th style={{ width: '180px' }}>{t('common.status')}</th><th style={{ textAlign: 'center', width: '180px' }}>{t('common.actions')}</th></tr></thead>
              <tbody>
                {documents.map((d, index) => (
                  <tr key={d.id} className="table-row-animate">
                    <td style={{ fontWeight: '800', color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>{new Date(d.request_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}</td>
                    {!isTeacher && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '10px', fontSize: '11px', background: 'linear-gradient(135deg, var(--p-indigo), #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                            {d.nom[0]}{d.prenom[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>{d.nom} {d.prenom}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                              {d.department_name && d.department_name !== 'null' ? (
                                (() => {
                                  const dept = d.department_name.trim();
                                  const translated = t('departments.' + dept);
                                  return translated === 'departments.' + dept ? dept : translated;
                                })()
                              ) : '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td style={{ fontWeight: '700', color: '#1e293b' }}>{translateDocType(d.type)}</td>
                    <td>
                      <span className={`badge-pro ${d.status === 'Ready' || d.status === 'Delivered' ? 'badge-pro-success' : d.status === 'Rejected' ? 'badge-pro-danger' : 'badge-pro-warning'}`} style={{ padding: '6px 12px', borderRadius: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(d.status === 'Ready' || d.status === 'Delivered') && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          {(d.status === 'Processing' || d.status === 'Pending') && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', animation: 'badgePulse 2s infinite' }}></span>}
                          {translateStatus(d.status)}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {isTeacher && d.status?.toLowerCase() === 'ready' && (
                          <button 
                            onClick={() => handleStatusUpdate(d.id, 'Delivered')} 
                            className="btn-confirm-pro" 
                            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px', fontWeight: '800' }}
                          >
                            {t('documents.confirmReceipt')}
                          </button>
                        )}
                        {!isTeacher && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%' }}>
                            {!['ready', 'rejected', 'delivered'].includes(d.status?.toLowerCase()) ? (
                              <button onClick={() => setActiveDocId(d.id)} className="btn-confirm-pro" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px', flex: 1, fontWeight: '800' }}>
                                {t('documents.processRequest')}
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleDelete(d.id)} 
                                className="btn-delete-pro" 
                                style={{ padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && <tr><td colSpan={isTeacher ? 4 : 6} className="empty-state-cell" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('documents.noRequests')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeDocId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card-academic animate-mnadm" style={{ width: '100%', maxWidth: '500px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h3 className="serif" style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>{t('documents.processRequest')}</h3>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>{t('documents.processingInstruction') || 'Mettez à jour le statut et ajoutez une note pour l\'enseignant.'}</p>
            
            <div className="mnadm-form-group" style={{ marginBottom: '32px' }}>
              <label className="mnadm-label" style={{ color: '#0f172a', fontWeight: '800' }}>{t('documents.adminNote')}</label>
              <textarea 
                className="mnadm-input" 
                placeholder={t('documents.notePlaceholder') || "Ex: Votre document est prêt au bureau RH"}
                value={responseNote} 
                onChange={(e) => setResponseNote(e.target.value)} 
                rows="4"
                style={{ padding: '16px', borderRadius: '16px', fontSize: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleStatusUpdate(activeDocId, 'Processing')} className="btn-confirm-pro" style={{ background: '#f59e0b', borderRadius: '14px', flex: 1, padding: '14px', fontSize: '13px', fontWeight: '800' }}>
                  {t('documents.markProcessing')}
                </button>
                <button onClick={() => handleStatusUpdate(activeDocId, 'Ready')} className="btn-confirm-pro" style={{ borderRadius: '14px', flex: 1, padding: '14px', fontSize: '13px', fontWeight: '800' }}>
                  {t('documents.ready')}
                </button>
              </div>
              <button onClick={() => { setActiveDocId(null); setResponseNote(''); }} className="btn-cancel-pro" style={{ borderRadius: '14px', padding: '14px', width: '100%', fontSize: '13px', fontWeight: '800', background: '#f1f5f9', color: '#64748b', border: 'none' }}>
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
    </div>
  );
}

export default ManageDocuments;
