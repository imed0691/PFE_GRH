import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageAbsences() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReasons, setExpandedReasons] = useState({});
  const [userRole, setUserRole] = useState('');
  const { t } = useLanguage();

  useEffect(() => { const token = localStorage.getItem('token'); if (token) { try { setUserRole(JSON.parse(atob(token.split('.')[1])).role); } catch (e) {} } }, []);

  const toggleReason = (id) => setExpandedReasons(prev => ({ ...prev, [id]: !prev[id] }));

  const fetchAbsences = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/absences', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setAbsences(await res.json()); } catch (error) { toast.error(t('absences.errorLoading')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAbsences(); }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) });
      if (res.ok) { toast.success(`${t('absences.statusUpdated')} ${status}`); fetchAbsences(); }
      else { toast.error(t('absences.errorUpdating')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isDeptHead = userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT';
  const isHigherAdmin = ['DEAN','DOYEN','VICE_DEAN','VICE_DOYEN','RECTOR','RECTEUR','VICE_RECTOR','VICE_RECTEUR','HR','RH','HR_MANAGER','RH_MANAGER'].includes(userRole);

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('absences.title')}</h3>
      <table className="modern-table">
        <thead><tr><th>#</th><th>{t('common.date')}</th><th>{t('common.teacher')}</th><th>{t('teacher.reason')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr></thead>
        <tbody>
          {absences.map((a, index) => (
            <tr key={a.id}>
              <td>{index + 1}</td>
              <td>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
              <td><strong>{a.nom}</strong> {a.prenom}</td>
              <td style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                {expandedReasons[a.id] || a.reason.length <= 50 ? a.reason : `${a.reason.substring(0, 50)}... `}
                {a.reason.length > 50 && <button onClick={() => toggleReason(a.id)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline', padding: 0, marginLeft: '5px' }}>{expandedReasons[a.id] ? t('common.seeLess') : t('common.seeMore')}</button>}
              </td>
              <td><span className="role-tag" style={{ background: a.status === 'Approved' ? '#d1fae5' : a.status === 'Rejected' ? '#fee2e2' : a.status === 'Recommended' ? '#dbeafe' : '#fef3c7', color: a.status === 'Approved' ? '#065f46' : a.status === 'Rejected' ? '#991b1b' : a.status === 'Recommended' ? '#1e40af' : '#92400e' }}>{a.status}</span></td>
              <td>
                {a.status === 'Pending' && isDeptHead && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleUpdateStatus(a.id, 'Recommended')} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('absences.recommendApproval')}</button>
                    <button onClick={() => handleUpdateStatus(a.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('common.reject')}</button>
                  </div>
                )}
                {a.status === 'Recommended' && isHigherAdmin && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleUpdateStatus(a.id, 'Approved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('absences.finalApprove')}</button>
                    <button onClick={() => handleUpdateStatus(a.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('common.reject')}</button>
                  </div>
                )}
                {a.status === 'Pending' && isHigherAdmin && <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>{t('absences.waitingDeptRecommendation')}</span>}
              </td>
            </tr>
          ))}
          {absences.length === 0 && <tr><td colSpan="6" className="empty-state">{t('absences.noRequests')}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default ManageAbsences;
