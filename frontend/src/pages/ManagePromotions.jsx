import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

const gradeHierarchy = ['Teacher', 'Vacataire', 'Assistant', 'MAB', 'MAA', 'MCB', 'MCA', 'Professeur'];

function ManagePromotions({ user }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserGrade, setCurrentUserGrade] = useState(user.grade || 'Teacher');
  const [requestedGrade, setRequestedGrade] = useState('');
  const [file, setFile] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [activePromoId, setActivePromoId] = useState(null);
  const [newBaseSalary, setNewBaseSalary] = useState(0);
  const [newHourlyRate, setNewHourlyRate] = useState(0);
  const [newAbsencePenalty, setNewAbsencePenalty] = useState(0);
  const { t } = useLanguage();
  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isDean = user.role === 'DEAN' || user.role === 'DOYEN';
  const isRector = user.role === 'RECTOR' || user.role === 'RECTEUR';
  const isHR = user.role === 'HR' || user.role === 'RH' || user.role === 'HR_MANAGER' || user.role === 'RH_MANAGER';

  const fetchCurrentProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUserGrade(data.grade || 'Teacher');
        const updatedUser = { ...user, grade: data.grade };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log("Profile synchronized:", data.grade);
      } else {
        const errorText = await res.text();
        toast.error("Erreur Sync Profil: " + res.status + " " + errorText);
      }
    } catch (e) { 
      console.error('Error fetching profile:', e);
      toast.error("Erreur Connexion Profil: " + e.message);
    }
  };

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

  useEffect(() => { 
    fetchPromotions(); 
    fetchCurrentProfile();
  }, []);

  const handleRequestPromotion = async (e) => {
    e.preventDefault(); if (!requestedGrade || !file) return toast.error(t('absences.allFieldsRequired') || 'Tous les champs sont requis');
    
    const formData = new FormData();
    formData.append('requested_grade', requestedGrade);
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch('http://localhost:5000/api/promotions', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: formData 
      });
      if (res.ok) { 
        toast.success(t('promotions.submitted')); 
        setRequestedGrade(''); 
        setFile(null);
        fetchPromotions(); 
      } else { 
        const errorData = await res.json();
        toast.error(`${t('promotions.errorSubmitting')}: ${errorData.error || errorData.message}`); 
      }
    } catch (error) { 
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
        body: JSON.stringify({ 
          status, 
          finalGrade, 
          base_salary: newBaseSalary, 
          hourly_rate: newHourlyRate, 
          absence_penalty: newAbsencePenalty 
        }) 
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



  const currentGradeIndex = gradeHierarchy.findIndex(g => g.toUpperCase() === currentUserGrade.toUpperCase());
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
        currentUserGrade.toUpperCase() === 'PROFESSEUR' ? (
          <div className="card-academic" style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', marginBottom: '32px', textAlign: 'left', borderLeft: '5px solid var(--p-indigo)' }}>
             <h4 style={{ color: 'var(--secondary)', margin: '0 0 4px 0', fontSize: '18px' }}>{t('promotions.maxGradeReached')}</h4>
             {t('promotions.congratsProf') && <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{t('promotions.congratsProf')}</p>}
          </div>
        ) : (
          <form onSubmit={handleRequestPromotion} className="card-academic" style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--border-soft)' }}>
            <h4 style={{ margin: '0 0 20px 0', color: 'var(--secondary)', fontSize: '18px' }}>{t('promotions.requestPromotion')}</h4>
            <div className="mnadm-form-row">
              <div className="mnadm-form-group">
                <label className="mnadm-label">{t('promotions.currentGrade')}</label>
                <input type="text" className="mnadm-input" value={t('grades.' + currentUserGrade) || currentUserGrade} disabled />
              </div>
              <div className="mnadm-form-group">
                <label className="mnadm-label">{t('promotions.requestedGrade')}</label>
                <select className="mnadm-input" value={requestedGrade} onChange={e => setRequestedGrade(e.target.value)} required>
                  <option value="">{t('promotions.selectNextGrade')}</option>
                  {availableGrades.map(g => <option key={g} value={g}>{t('grades.' + g) || g}</option>)}
                </select>
              </div>
              <div className="mnadm-form-group">
                <label className="mnadm-label">{t('absences.attachmentLabel') || 'Pièce jointe (PDF/Diplôme)'}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label className="btn-confirm-pro" style={{ 
                    padding: '8px 16px', 
                    fontSize: '14px', 
                    cursor: 'pointer', 
                    background: 'var(--bg-main)', 
                    color: 'var(--p-indigo)', 
                    border: '1px solid var(--p-indigo)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    {t('common.chooseFile') || 'Choisir un fichier'}
                    <input 
                      type="file" 
                      onChange={e => setFile(e.target.files[0])} 
                      required 
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '13px', color: file ? 'var(--p-indigo)' : '#888', fontStyle: 'italic' }}>
                    {file ? file.name : (t('common.noFileSelected') || 'Aucun fichier sélectionné')}
                  </span>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>{t('promotions.submitFile')}</button>
          </form>
        )
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
                      {p.file_path && (
                        <div style={{ marginBottom: '8px' }}>
                          <button 
                            onClick={() => window.open(`http://localhost:5000/uploads/promotions/${p.file_path}`, '_blank')}
                            className="btn-action-pro" 
                            style={{ width: 'auto', padding: '0 12px', height: '32px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            {t('absences.viewAttachment') || 'Voir le dossier'}
                          </button>
                        </div>
                      )}
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
                        <div className="finalize-form" style={{ marginTop: '15px', padding: '15px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--p-indigo)', textTransform: 'uppercase', marginBottom: '12px' }}>
                            {t('promotions.finalizeFinancials') || 'Paramètres financiers pour le nouveau grade :'}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '12px' }}>
                            <div>
                              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('salary.baseSalary') || 'Salaire de base (DA)'}</label>
                              <input type="number" className="mnadm-input" value={newBaseSalary} onChange={e => setNewBaseSalary(e.target.value)} style={{ height: '36px', fontSize: '12px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('salary.hourlyRate') || 'Taux H. Supp'}</label>
                                <input type="number" className="mnadm-input" value={newHourlyRate} onChange={e => setNewHourlyRate(e.target.value)} style={{ height: '36px', fontSize: '12px' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('salary.absencePenalty') || 'Pénalité'}</label>
                                <input type="number" className="mnadm-input" value={newAbsencePenalty} onChange={e => setNewAbsencePenalty(e.target.value)} style={{ height: '36px', fontSize: '12px' }} />
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleStatusUpdate(p.id, 'Approved', p.requested_grade)}
                            className="btn-confirm-pro"
                            style={{ width: '100%', padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            {t('promotions.updateFile')}
                          </button>
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
