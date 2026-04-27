import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageRecruitments({ user }) {
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionTitle, setPositionTitle] = useState('');
  const [numberNeeded, setNumberNeeded] = useState(1);
  const [justification, setJustification] = useState('');
  const { t } = useLanguage();

  const fetchRecruitments = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/recruitments', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setRecruitments(await res.json()); } catch (error) { toast.error(t('recruitments.errorLoading')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRecruitments(); }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/recruitments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ position_title: positionTitle, number_needed: numberNeeded, justification }) });
      if (res.ok) { toast.success(t('recruitments.submitted')); setPositionTitle(''); setNumberNeeded(1); setJustification(''); fetchRecruitments(); } else { toast.error(t('recruitments.errorSubmitting')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { const token = localStorage.getItem('token'); const res = await fetch(`http://localhost:5000/api/recruitments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) });
      if (res.ok) { toast.success(`${t('recruitments.statusUpdated')} → ${status}`); fetchRecruitments(); } else { toast.error(t('recruitments.errorStatus')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isDean = ['DEAN', 'DOYEN'].includes(user.role);
  const isRector = ['RECTOR', 'RECTEUR'].includes(user.role);
  const isHR = ['HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(user.role);

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('recruitments.title')}</h3>
      {isDeptHead && (
        <form onSubmit={handleSubmitRequest} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>{t('recruitments.requestNewHires')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('recruitments.positionTitle')}</label><input type="text" value={positionTitle} onChange={e => setPositionTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('recruitments.numberNeeded')}</label><input type="number" min="1" value={numberNeeded} onChange={e => setNumberNeeded(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
          </div>
          <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('recruitments.justification')}</label><textarea value={justification} onChange={e => setJustification(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder={t('recruitments.justificationPlaceholder')}></textarea></div>
          <button type="submit" className="btn-submit" style={{ background: '#0ea5e9' }}>{t('recruitments.submitRequest')}</button>
        </form>
      )}
      {loading ? <div className="loading-spinner">{t('recruitments.loadingRecruitments')}</div> : (
        <table className="modern-table">
          <thead><tr><th>#</th><th>{t('recruitments.positionVacancies')}</th><th>{t('common.department')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr></thead>
          <tbody>
            {recruitments.map((r, index) => (
              <tr key={r.id}>
                <td>{index + 1}</td>
                <td><strong>{r.position_title}</strong><br/><small style={{ color: '#64748b' }}>{t('recruitments.reqBy')} {r.requester_nom} {r.requester_prenom}</small><br/><small style={{ color: '#0ea5e9' }}>{r.number_needed} {t('recruitments.vacancies')}</small></td>
                <td>{r.department_name || '-'}</td>
                <td><span className="role-tag" style={{ background: r.status === 'Published' ? '#d1fae5' : r.status === 'Rejected' ? '#fee2e2' : r.status === 'Completed' ? '#e0e7ff' : '#fef3c7', color: r.status === 'Published' ? '#065f46' : r.status === 'Rejected' ? '#991b1b' : r.status === 'Completed' ? '#3730a3' : '#92400e' }}>{r.status}</span></td>
                <td>
                  {isDean && r.status === 'Pending' && <button onClick={() => handleStatusUpdate(r.id, 'Approved_Faculty')} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('recruitments.approveFaculty')}</button>}
                  {isRector && (r.status === 'Pending' || r.status === 'Approved_Faculty') && <button onClick={() => handleStatusUpdate(r.id, 'Approved_Rector')} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('recruitments.finalApproval')}</button>}
                  {isHR && r.status === 'Approved_Rector' && <button onClick={() => handleStatusUpdate(r.id, 'Published')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('recruitments.publishVacancy')}</button>}
                  {isHR && r.status === 'Published' && <button onClick={() => handleStatusUpdate(r.id, 'Completed')} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('recruitments.hiringCompleted')}</button>}
                </td>
              </tr>
            ))}
            {recruitments.length === 0 && <tr><td colSpan="5" className="empty-state">{t('recruitments.noRecords')}</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageRecruitments;
