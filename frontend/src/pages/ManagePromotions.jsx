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
    console.log("[ManagePromotions] --> GET /api/promotions requested");
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch('http://localhost:5000/api/promotions', { headers: { 'Authorization': `Bearer ${token}` } }); 
      console.log("[ManagePromotions] <-- GET /api/promotions response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[ManagePromotions] <-- GET /api/promotions data:", data);
        setPromotions(data);
      } 
    } catch (error) { 
      console.error("[ManagePromotions] Error fetching promotions:", error);
      toast.error(t('promotions.errorLoading')); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const handleRequestPromotion = async (e) => {
    e.preventDefault(); if (!requestedGrade) return;
    console.log("[ManagePromotions] --> POST /api/promotions payload:", { requested_grade: requestedGrade });
    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch('http://localhost:5000/api/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ requested_grade: requestedGrade }) });
      console.log("[ManagePromotions] <-- POST /api/promotions response status:", res.status);
      if (res.ok) { toast.success(t('promotions.submitted')); setRequestedGrade(''); fetchPromotions(); } else { toast.error(t('promotions.errorSubmitting')); }
    } catch (error) { 
      console.error("[ManagePromotions] Error submitting promotion:", error);
      toast.error(t('common.serverError')); 
    }
  };

  const handleRecommendation = async (id) => {
    if (!recommendation) return toast.error(t('promotions.enterRecommendation'));
    console.log(`[ManagePromotions] --> PUT /api/promotions/${id}/recommend payload:`, { recommendation });
    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/recommend`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ recommendation }) });
      console.log(`[ManagePromotions] <-- PUT /api/promotions/${id}/recommend response status:`, res.status);
      if (res.ok) { toast.success(t('promotions.recommendationSubmitted')); setRecommendation(''); setActivePromoId(null); fetchPromotions(); } else { toast.error(t('promotions.errorRecommendation')); }
    } catch (error) { 
      console.error("[ManagePromotions] Error recommending promotion:", error);
      toast.error(t('common.serverError')); 
    }
  };

  const handleStatusUpdate = async (id, status) => {
    console.log(`[ManagePromotions] --> PUT /api/promotions/${id}/status payload:`, { status });
    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) });
      console.log(`[ManagePromotions] <-- PUT /api/promotions/${id}/status response status:`, res.status);
      if (res.ok) { toast.success(`${t('promotions.promotionApproved')} ${status}`); fetchPromotions(); } else { toast.error(t('promotions.errorStatus')); }
    } catch (error) { 
      console.error("[ManagePromotions] Error updating status:", error);
      toast.error(t('common.serverError')); 
    }
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isDean = user.role === 'DEAN' || user.role === 'DOYEN';
  const isRector = user.role === 'RECTOR' || user.role === 'RECTEUR';
  const isHR = user.role === 'HR' || user.role === 'RH' || user.role === 'HR_MANAGER' || user.role === 'RH_MANAGER';

  const currentGradeIndex = gradeHierarchy.indexOf(user.grade || 'Teacher');
  const availableGrades = gradeHierarchy.slice(currentGradeIndex + 1);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#d1fae5', color: '#065f46' };
      case 'Rejected': return { bg: '#fee2e2', color: '#991b1b' };
      case 'Pending_Dept': return { bg: '#fef3c7', color: '#92400e', label: 'Pending Dept' };
      case 'Pending_Dean': return { bg: '#dbeafe', color: '#1e40af', label: 'With Dean' };
      case 'Pending_Rector': return { bg: '#e0e7ff', color: '#3730a3', label: 'With Rector' };
      case 'Pending_HR': return { bg: '#f3e8ff', color: '#6b21a8', label: 'With HR' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

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
          <thead><tr><th>#</th><th>{t('promotions.candidate')}</th><th>{t('promotions.transition')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr></thead>
          <tbody>
            {promotions.map((p, index) => {
              const pStatus = p.status === 'Pending' ? 'Pending_Dept' : p.status;
              const style = getStatusStyle(pStatus);
              const canRecommend = (isDeptHead && pStatus === 'Pending_Dept') ||
                (isDean && pStatus === 'Pending_Dean') ||
                (isRector && pStatus === 'Pending_Rector');
              const canApprove = isHR && pStatus === 'Pending_HR';

              let actionLabel = t('promotions.addRecommendation');
              let submitLabel = t('common.submit');
              if (isDeptHead) { actionLabel = "Traiter & Envoyer au Doyen"; submitLabel = "Envoyer au Doyen"; }
              else if (isDean) { actionLabel = "Traiter & Envoyer au Recteur"; submitLabel = "Envoyer au Recteur"; }
              else if (isRector) { actionLabel = "Traiter & Envoyer aux RH"; submitLabel = "Envoyer aux RH"; }

              return (
                <tr key={p.id}>
                  <td>{index + 1}</td>
                  <td><strong>{p.nom} {p.prenom}</strong><br /><small style={{ color: '#64748b' }}>{p.department_name || '-'}</small></td>
                  <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{p.current_grade}</span> → <span className="role-tag" style={{ background: '#ede9fe', color: '#5b21b6' }}>{p.requested_grade}</span></td>
                  <td><span className="role-tag" style={{ background: style.bg, color: style.color }}>{style.label || p.status}</span></td>
                  <td>
                    {p.dept_head_recommendation && (
                      <div style={{ marginBottom: '8px', padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                        <div style={{ fontWeight: '600', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}>Historique des avis :</div>
                        {p.dept_head_recommendation}
                      </div>
                    )}
                    {canRecommend && (activePromoId === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <textarea value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder={t('promotions.writeRecommendation')} rows="2" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleRecommendation(p.id)} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>{submitLabel}</button>
                          <button onClick={() => setActivePromoId(null)} style={{ flex: 1, background: '#94a3b8', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>{t('common.cancel')}</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setActivePromoId(p.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>{actionLabel}</button>
                        <button onClick={() => handleStatusUpdate(p.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>{t('common.reject')}</button>
                      </div>
                    ))}
                    {canApprove && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => handleStatusUpdate(p.id, 'Approved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('common.approve')}</button>
                        <button onClick={() => handleStatusUpdate(p.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>{t('common.reject')}</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {promotions.length === 0 && <tr><td colSpan="5" className="empty-state">{t('promotions.noRecords')}</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManagePromotions;
