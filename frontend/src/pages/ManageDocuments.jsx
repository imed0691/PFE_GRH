import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageDocuments({ user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedType, setRequestedType] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [activeDocId, setActiveDocId] = useState(null);
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
      if (res.ok) { toast.success(`${t('documents.requestMarkedAs')} ${status}`); setActiveDocId(null); setResponseNote(''); fetchDocuments(); } else { toast.error(t('documents.errorUpdating')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const isAdmin = ['HR','RH','DEAN','DOYEN','VICE_DEAN','VICE_DOYEN','DEPARTMENT_HEAD','CHEF_DEPARTEMENT'].includes(user.role);

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
    if (status === 'Ready') return t('documents.ready');
    if (status === 'Processing') return t('documents.processing') || 'Processing';
    if (status === 'Rejected') return t('absences.rejected') || status;
    if (status === 'Pending') return t('absences.pending') || status;
    return status;
  };

  return (
    <div className="card-academic" style={{ padding: '32px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '24px' }}>{t('documents.title')}</h3>
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
            <thead><tr><th>#</th><th>{t('common.date')}</th>{!isTeacher && <th>{t('common.teacher')}</th>}<th>{t('documents.docType')}</th><th>{t('common.status')}</th>{!isTeacher && <th>{t('common.actions')}</th>}</tr></thead>
            <tbody>
              {documents.map((d, index) => (
                <tr key={d.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(d.request_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}</td>
                  {!isTeacher && <td><strong>{d.nom}</strong> {d.prenom}<br/><small style={{color: 'var(--text-muted)'}}>{d.department_name || '-'}</small></td>}
                  <td><strong>{translateDocType(d.type)}</strong></td>
                  <td>
                    <span className={`badge-pro ${d.status === 'Ready' ? 'badge-pro-success' : d.status === 'Rejected' ? 'badge-pro-danger' : 'badge-pro-warning'}`}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {d.status === 'Ready' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        {d.status === 'Processing' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
                        {translateStatus(d.status)}
                      </span>
                    </span>
                  </td>
                  {!isTeacher && (
                    <td>{d.status !== 'Ready' && d.status !== 'Rejected' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeDocId === d.id ? (<>
                          <textarea className="mnadm-input" placeholder="e.g. Available at office 102" value={responseNote} onChange={(e) => setResponseNote(e.target.value)} style={{ padding: '12px', fontSize: '13px', minHeight: '80px' }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleStatusUpdate(d.id, 'Processing')} className="btn-confirm-pro" style={{ flex: 1, padding: '10px', fontSize: '12px', background: 'var(--warning) !important', boxShadow: 'none' }}>{t('documents.markProcessing')}</button>
                            <button onClick={() => handleStatusUpdate(d.id, 'Ready')} className="btn-confirm-pro" style={{ flex: 1, padding: '10px', fontSize: '12px' }}>{t('documents.ready')}</button>
                          </div>
                          <button onClick={() => setActiveDocId(null)} className="btn-cancel-pro" style={{ padding: '10px', fontSize: '12px' }}>{t('common.cancel')}</button>
                        </>) : (
                          <button onClick={() => setActiveDocId(d.id)} className="btn-confirm-pro" style={{ padding: '8px 16px', fontSize: '12px' }}>{t('documents.processRequest')}</button>
                        )}
                      </div>
                    )}</td>
                  )}
                </tr>
              ))}
              {documents.length === 0 && <tr><td colSpan={isTeacher ? 4 : 6} className="empty-state-cell">{t('documents.noRequests')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageDocuments;
