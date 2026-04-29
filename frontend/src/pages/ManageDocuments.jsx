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

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('documents.title')}</h3>
      {isTeacher && (
        <form onSubmit={handleRequestDocument} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>{t('documents.requestNew')}</h4>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>{t('documents.docType')}</label>
              <select value={requestedType} onChange={(e) => setRequestedType(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">{t('documents.selectDocType')}</option>
                <option value="Work Certificate (Attestation de travail)">{t('documents.workCert')}</option>
                <option value="Salary Slip (Fiche de paie)">{t('documents.salarySlip')}</option>
                <option value="Teaching Load Certificate">{t('documents.teachingLoad')}</option>
                <option value="Mission Order (Ordre de mission)">{t('documents.missionOrder')}</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" style={{ margin: 0, padding: '10px 20px', height: 'fit-content', background: '#3b82f6' }}>{t('documents.submitRequest')}</button>
          </div>
        </form>
      )}
      {loading ? <div className="loading-spinner">{t('documents.loadingRequests')}</div> : (
        <table className="modern-table">
          <thead><tr><th>#</th><th>{t('common.date')}</th>{!isTeacher && <th>{t('common.teacher')}</th>}<th>{t('documents.docType')}</th><th>{t('common.status')}</th>{!isTeacher && <th>{t('common.actions')}</th>}</tr></thead>
          <tbody>
            {documents.map((d, index) => (
              <tr key={d.id}>
                <td>{index + 1}</td>
                <td>{new Date(d.request_date).toLocaleDateString('en-GB')}</td>
                {!isTeacher && <td><strong>{d.nom}</strong> {d.prenom}<br/><small style={{color: '#64748b'}}>{d.department_name || '-'}</small></td>}
                <td><strong>{d.type}</strong></td>
                <td><span className="role-tag" style={{ background: d.status === 'Ready' ? '#e0e7ff' : d.status === 'Rejected' ? '#fee2e2' : d.status === 'Processing' ? '#fef3c7' : '#e2e8f0', color: d.status === 'Ready' ? '#3730a3' : d.status === 'Rejected' ? '#991b1b' : d.status === 'Processing' ? '#92400e' : '#475569' }}>{d.status === 'Ready' ? t('documents.ready') : d.status}</span></td>
                {!isTeacher && (
                  <td>{d.status !== 'Ready' && d.status !== 'Rejected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {activeDocId === d.id ? (<>
                        <textarea placeholder="e.g. Available at office 102" value={responseNote} onChange={(e) => setResponseNote(e.target.value)} style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleStatusUpdate(d.id, 'Processing')} style={{ flex: 1, background: '#f59e0b', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>{t('documents.markProcessing')}</button>
                          <button onClick={() => handleStatusUpdate(d.id, 'Ready')} style={{ flex: 1, background: 'var(--p-indigo)', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>{t('documents.ready')}</button>
                        </div>
                        <button onClick={() => setActiveDocId(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>{t('common.cancel')}</button>
                      </>) : (
                        <button onClick={() => setActiveDocId(d.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('documents.processRequest')}</button>
                      )}
                    </div>
                  )}</td>
                )}
              </tr>
            ))}
            {documents.length === 0 && <tr><td colSpan={isTeacher ? 4 : 6} className="empty-state">{t('documents.noRequests')}</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageDocuments;
