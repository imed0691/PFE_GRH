import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

const gradeHierarchy = ['Teacher', 'Vacataire', 'Assistant', 'Maître-Assistant B', 'Maître-Assistant A', 'Maître de Conférences B', 'Maître de Conférences A', 'Professeur'];

function ManagePromotions({ user }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedGrade, setRequestedGrade] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [activePromoId, setActivePromoId] = useState(null);
  const { t } = useLanguage();

  const fetchPromotions = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/promotions', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setPromotions(await res.json()); } catch (error) { toast.error(t('promotions.errorLoading')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const handleRequestPromotion = async (e) => {
    e.preventDefault(); if (!requestedGrade) return;
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ requested_grade: requestedGrade }) });
      if (res.ok) { toast.success(t('promotions.submitted')); setRequestedGrade(''); fetchPromotions(); } else { toast.error(t('promotions.errorSubmitting')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleRecommendation = async (id) => {
    if (!recommendation) return toast.error(t('promotions.enterRecommendation'));
    try { const token = localStorage.getItem('token'); const res = await fetch(`http://localhost:5000/api/promotions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ dept_recommendation: recommendation }) });
      if (res.ok) { toast.success(t('promotions.recommendationSubmitted')); setRecommendation(''); setActivePromoId(null); fetchPromotions(); } else { toast.error(t('promotions.errorRecommendation')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { const token = localStorage.getItem('token'); const res = await fetch(`http://localhost:5000/api/promotions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) });
      if (res.ok) { toast.success(`${t('promotions.promotionApproved')} ${status}`); fetchPromotions(); } else { toast.error(t('promotions.errorStatus')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isHigherAdmin = ['DEAN','DOYEN','RECTOR','RECTEUR','HR','RH','HR_MANAGER','RH_MANAGER'].includes(user.role);

  const currentGradeIndex = gradeHierarchy.indexOf(user.grade || 'Teacher');
  const availableGrades = gradeHierarchy.slice(currentGradeIndex + 1);

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('promotions.title')}</h3>
      {isTeacher && (
        <form onSubmit={handleRequestPromotion} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>{t('promotions.requestPromotion')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('promotions.currentGrade')}</label><input type="text" value={user.grade || 'Teacher'} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9' }} /></div>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('promotions.requestedGrade')}</label><select value={requestedGrade} onChange={e => setRequestedGrade(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="">{t('promotions.selectNextGrade')}</option>{availableGrades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          </div>
          <button type="submit" className="btn-submit" style={{ background: '#8b5cf6' }}>{t('promotions.submitFile')}</button>
        </form>
      )}
      {loading ? <div className="loading-spinner">{t('promotions.loadingPromos')}</div> : (
        <table className="modern-table">
          <thead><tr><th>{t('promotions.candidate')}</th><th>{t('promotions.transition')}</th><th>{t('common.status')}</th><th>{t('promotions.deptRecommendation')}</th><th>{t('common.actions')}</th></tr></thead>
          <tbody>
            {promotions.map(p => (
              <tr key={p.id}>
                <td><strong>{p.nom} {p.prenom}</strong><br/><small style={{ color: '#64748b' }}>{p.department_name || '-'}</small></td>
                <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{p.current_grade}</span> → <span className="role-tag" style={{ background: '#ede9fe', color: '#5b21b6' }}>{p.requested_grade}</span></td>
                <td><span className="role-tag" style={{ background: p.status === 'Approved' ? '#d1fae5' : p.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: p.status === 'Approved' ? '#065f46' : p.status === 'Rejected' ? '#991b1b' : '#92400e' }}>{p.status}</span></td>
                <td style={{ maxWidth: '200px', wordBreak: 'break-word', fontStyle: 'italic', fontSize: '13px' }}>{p.dept_recommendation || <span style={{ color: '#94a3b8' }}>{t('promotions.pendingEvaluation')}</span>}</td>
                <td>
                  {isDeptHead && p.status === 'Pending' && !p.dept_recommendation && (activePromoId === p.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <textarea value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder={t('promotions.writeRecommendation')} rows="2" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => handleRecommendation(p.id)} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>{t('common.submit')}</button>
                        <button onClick={() => setActivePromoId(null)} style={{ flex: 1, background: '#94a3b8', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>{t('common.cancel')}</button>
                      </div>
                    </div>
                  ) : <button onClick={() => setActivePromoId(p.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>{t('promotions.addRecommendation')}</button>)}
                  {isHigherAdmin && p.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleStatusUpdate(p.id, 'Approved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('common.approve')}</button>
                      <button onClick={() => handleStatusUpdate(p.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('common.reject')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {promotions.length === 0 && <tr><td colSpan="5" className="empty-state">{t('promotions.noRecords')}</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManagePromotions;
