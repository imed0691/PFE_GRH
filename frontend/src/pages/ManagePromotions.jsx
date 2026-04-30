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

  const handleRecommendation = async (id, action = 'approve') => {
    if (action === 'approve' && !recommendation) return toast.error(t('promotions.enterRecommendation'));
    console.log(`[ManagePromotions] --> PUT /api/promotions/${id}/recommend payload:`, { recommendation, action });
    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/recommend`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ recommendation, action }) 
      });
      if (res.ok) { 
        toast.success(action === 'reject' ? t('common.rejected') : t('promotions.recommendationSubmitted')); 
        setRecommendation(''); 
        setActivePromoId(null); 
        fetchPromotions(); 
      } else { 
        toast.error(t('promotions.errorRecommendation')); 
      }
    } catch (error) { 
      toast.error(t('common.serverError')); 
    }
  };

  const handleStatusUpdate = async (id, status, finalGrade = null) => {
    console.log(`[ManagePromotions] --> PUT /api/promotions/${id}/status payload:`, { status, finalGrade });
    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/status`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ status, finalGrade }) 
      });
      if (res.ok) { 
        toast.success(status === 'Approved' ? t('promotions.gradeUpdated') || 'Grade mis à jour avec succès' : t('promotions.promotionRejected')); 
        fetchPromotions(); 
      } else { 
        toast.error(t('promotions.errorStatus')); 
      }
    } catch (error) { 
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
      case 'Approved': return { bg: '#dcfce7', color: '#166534', label: t('common.completed') || 'Completed' };
      case 'Rejected': return { bg: '#fee2e2', color: '#991b1b', label: t('promotions.rejectedByHR') || 'Rejected by HR' };
      case 'Rejected_Dean': return { bg: '#fee2e2', color: '#991b1b', label: t('promotions.rejectedByDean') || 'Rejected by Dean' };
      case 'Pending_Dept': return { bg: '#fef3c7', color: '#92400e', label: t('promotions.pendingDept') || 'Pending Dept' };
      case 'Pending_Dean': return { bg: '#dbeafe', color: '#1e40af', label: t('promotions.withDean') || 'With Dean' };
      case 'Pending_Rector': return { bg: '#e0e7ff', color: '#3730a3', label: t('promotions.withRector') || 'With Rector' };
      case 'Pending_HR': return { bg: '#f3e8ff', color: '#6b21a8', label: t('promotions.withHR') || 'With HR (Signed)' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <div className="card-academic" style={{ padding: '32px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '24px' }}>{t('promotions.title')}</h3>
      {isTeacher && (
        <form onSubmit={handleRequestPromotion} className="card-academic" style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--border-soft)' }}>
          <h4 style={{ margin: '0 0 20px 0', color: 'var(--secondary)', fontSize: '18px' }}>{t('promotions.requestPromotion')}</h4>
          <div className="mnadm-form-row">
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('promotions.currentGrade')}</label>
              <input type="text" className="mnadm-input" value={t('grades.' + (user.grade || 'Teacher'))} disabled />
            </div>
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('promotions.requestedGrade')}</label>
              <select className="mnadm-input" value={requestedGrade} onChange={e => setRequestedGrade(e.target.value)} required>
                <option value="">{t('promotions.selectNextGrade')}</option>
                {availableGrades.map(g => <option key={g} value={g}>{t('grades.' + g) || g}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '14px' }}>{t('promotions.submitFile')}</button>
        </form>
      )}
      {loading ? <div className="loading-spinner">{t('promotions.loadingPromos')}</div> : (
        <div className="modern-table-wrapper">
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

                const badgeClass = pStatus.includes('Rejected') ? 'badge-pro-danger' : 
                                 pStatus.includes('Approved') ? 'badge-pro-success' : 
                                 'badge-pro-warning';

                return (
                  <tr key={p.id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label={t('promotions.candidate')}>
                      <strong>{p.nom} {p.prenom}</strong><br />
                      <small style={{ color: 'var(--text-muted)' }}>
                        {p.department_name && p.department_name !== 'null' ? (
                          (() => {
                            const dept = p.department_name.trim();
                            const translated = t('departments.' + dept);
                            return translated === 'departments.' + dept ? dept : translated;
                          })()
                        ) : '-'}
                      </small>
                    </td>
                    <td data-label={t('promotions.transition')}>
                      <span className="role-tag">{p.current_grade}</span> 
                      <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>→</span> 
                      <span className="role-tag" style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)' }}>{t('grades.' + p.requested_grade) || p.requested_grade}</span>
                    </td>
                    <td data-label={t('common.status')}>
                      <span className={`badge-pro ${badgeClass}`}>
                        {pStatus.startsWith('Pending_') && (
                          <span style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            fontSize: '9px', 
                            fontWeight: '900', 
                            textTransform: 'uppercase',
                            marginRight: '8px',
                            animation: 'badgePulse 2s infinite'
                          }}>{t('common.new').toUpperCase()}</span>
                        )}
                        {style.label || p.status}
                      </span>
                    </td>
                    <td data-label={t('common.actions')}>
                      {p.dept_head_recommendation && (
                        <div style={{ marginBottom: '8px', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-soft)', fontSize: '12px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>{t('promotions.historyTitle')}</div>
                          <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{p.dept_head_recommendation}"</div>
                        </div>
                      )}
                      {canRecommend && (activePromoId === p.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea className="mnadm-input" value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder={t('promotions.writeRecommendation')} rows="2" />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleRecommendation(p.id, 'approve')} className="btn-confirm-pro" style={{ flex: 1, padding: '10px', fontSize: '12px' }}>{isRector ? t('promotions.signAndSend') : t('common.approve')}</button>
                            {isDean && <button onClick={() => handleRecommendation(p.id, 'reject')} className="btn-cancel-pro" style={{ flex: 1, padding: '10px', fontSize: '12px' }}>{t('common.reject')}</button>}
                            <button onClick={() => setActivePromoId(null)} className="btn-cancel-pro" style={{ flex: 1, padding: '10px', fontSize: '12px' }}>{t('common.cancel')}</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setActivePromoId(p.id)} className="btn-confirm-pro" style={{ padding: '8px 16px', fontSize: '12px' }}>
                          {isDeptHead ? t('promotions.validateAndSend') : isDean ? t('promotions.decideAndSend') : isRector ? t('promotions.signAndSend') : t('promotions.addRecommendation')}
                        </button>
                      ))}
                      {canApprove && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('promotions.finalizeGrade')}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select 
                              id={`grade-select-${p.id}`}
                              className="mnadm-input"
                              defaultValue={p.requested_grade}
                              style={{ flex: '2' }}
                            >
                              {gradeHierarchy.map(g => <option key={g} value={g}>{t('grades.' + g) || g}</option>)}
                            </select>
                            <button 
                              onClick={() => {
                                const finalGrade = document.getElementById(`grade-select-${p.id}`).value;
                                handleStatusUpdate(p.id, 'Approved', finalGrade);
                              }} 
                              className="btn-confirm-pro"
                              style={{ padding: '10px 16px', fontSize: '12px', flex: '1' }}
                            >
                              {t('promotions.updateFile')}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {promotions.length === 0 && <tr><td colSpan="5" className="empty-state-cell">{t('promotions.noRecords')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManagePromotions;
