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
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('promotions.title')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('promotions.manageTitle') || 'Gérez les demandes de promotion de grade'}</p>
          </div>
        </div>

        {isTeacher && (
          currentUserGrade.toUpperCase() === 'PROFESSEUR' ? (
            <div className="card-academic" style={{ background: '#f0fdf4', padding: '32px', borderRadius: '20px', marginBottom: '32px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
               <div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#16a34a' }}>
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
               </div>
               <h4 className="serif" style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>{t('promotions.maxGradeReached')}</h4>
               {t('promotions.congratsProf') && <p style={{ color: '#15803d', margin: 0, fontSize: '15px', fontWeight: '500' }}>{t('promotions.congratsProf')}</p>}
            </div>
          ) : (
            <form onSubmit={handleRequestPromotion} className="card-academic" style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--p-indigo)', color: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>+</div>
                <h4 className="serif" style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>{t('promotions.requestPromotion')}</h4>
              </div>
              <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                <div className="mnadm-form-group">
                  <label className="mnadm-label">{t('promotions.currentGrade')}</label>
                  <input type="text" className="mnadm-input" value={t('grades.' + currentUserGrade) || currentUserGrade} disabled style={{ background: '#f1f5f9', cursor: 'not-allowed', fontWeight: '700' }} />
                </div>
                <div className="mnadm-form-group">
                  <label className="mnadm-label">{t('promotions.requestedGrade')}</label>
                  <select className="mnadm-input" value={requestedGrade} onChange={e => setRequestedGrade(e.target.value)} required style={{ fontWeight: '700' }}>
                    <option value="">{t('promotions.selectNextGrade')}</option>
                    {availableGrades.map(g => <option key={g} value={g}>{t('grades.' + g) || g}</option>)}
                  </select>
                </div>
                <div className="mnadm-form-group">
                  <label className="mnadm-label">{t('absences.attachmentLabel') || 'Pièce jointe (PDF/Diplôme)'}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label className="btn-confirm-pro" style={{ 
                      padding: '10px 20px', 
                      fontSize: '13px', 
                      cursor: 'pointer', 
                      background: 'white', 
                      color: 'var(--p-indigo)', 
                      border: '1px solid #e2e8f0',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      fontWeight: '700'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      {t('common.chooseFile') || 'Choisir'}
                      <input 
                        type="file" 
                        onChange={e => setFile(e.target.files[0])} 
                        required 
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '13px', color: file ? 'var(--p-indigo)' : '#94a3b8', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      {file ? file.name : (t('common.noFileSelected') || 'Aucun fichier')}
                    </span>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '16px', marginTop: '24px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px' }}>{t('promotions.submitFile').toUpperCase()}</button>
            </form>
          )
        )}
        {loading ? <div className="loading-spinner" style={{ padding: '40px' }}>{t('promotions.loadingPromos')}</div> : (
          <div className="modern-table-wrapper" style={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <table className="modern-table">
              <thead><tr><th style={{ width: '60px' }}>#</th><th>{t('promotions.candidate')}</th><th>{t('promotions.transition')}</th><th>{t('common.status')}</th><th style={{ textAlign: 'center' }}>{t('common.actions')}</th></tr></thead>
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
                    <tr key={p.id} className="table-row-animate">
                      <td style={{ fontWeight: '800', color: '#94a3b8' }}>{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-circle" style={{ width: '36px', height: '36px', borderRadius: '12px', fontSize: '12px', background: 'linear-gradient(135deg, var(--p-indigo), #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                            {p.nom[0]}{p.prenom[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{p.nom} {p.prenom}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                              {p.department_name && p.department_name !== 'null' ? (
                                (() => {
                                  const dept = p.department_name.trim();
                                  const translated = t('departments.' + dept);
                                  return translated === 'departments.' + dept ? dept : translated;
                                })()
                              ) : '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="badge-pro" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '11px' }}>{p.current_grade}</span> 
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                          <span className="badge-pro" style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', border: '1px solid var(--p-indigo-light)', fontSize: '11px', fontWeight: '800' }}>{t('grades.' + p.requested_grade) || p.requested_grade}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-pro ${badgeClass}`} style={{ padding: '6px 12px', borderRadius: '10px' }}>
                          {pStatus.startsWith('Pending_') && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', animation: 'badgePulse 2s infinite', display: 'inline-block', marginRight: '8px' }}></span>
                          )}
                          {style.label || p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          {p.file_path && (
                            <button 
                              onClick={() => window.open(`http://localhost:5000/uploads/promotions/${p.file_path}`, '_blank')}
                              className="btn-action-pro" 
                              style={{ width: '100%', padding: '8px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                              {t('absences.viewAttachment') || 'Voir dossier'}
                            </button>
                          )}
                          {p.dept_head_recommendation && (
                            <div style={{ width: '100%', padding: '12px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                              <div style={{ fontWeight: '800', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}>{t('promotions.historyTitle') || 'RECOMMANDATION'}</div>
                              <div style={{ fontStyle: 'italic' }}>"{p.dept_head_recommendation}"</div>
                            </div>
                          )}
                          {canRecommend && (activePromoId === p.id ? (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                              <textarea className="mnadm-input" value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder={t('promotions.writeRecommendation')} rows="2" style={{ fontSize: '13px', borderRadius: '12px' }} />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleRecommendation(p.id, 'approve')} className="btn-confirm-pro" style={{ flex: 1, padding: '10px', fontSize: '11px', borderRadius: '10px' }}>{isRector ? t('promotions.signAndSend') : t('common.approve')}</button>
                                {isDean && <button onClick={() => handleRecommendation(p.id, 'reject')} className="btn-cancel-pro" style={{ flex: 1, padding: '10px', fontSize: '11px', borderRadius: '10px' }}>{t('common.reject')}</button>}
                                <button onClick={() => setActivePromoId(null)} className="btn-cancel-pro" style={{ flex: 1, padding: '10px', fontSize: '11px', borderRadius: '10px', background: '#f1f5f9', color: '#64748b', border: 'none' }}>{t('common.cancel')}</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setActivePromoId(p.id)} className="btn-confirm-pro" style={{ width: '100%', padding: '10px 16px', fontSize: '11px', borderRadius: '10px', fontWeight: '800' }}>
                              {isDeptHead ? t('promotions.validateAndSend') : isDean ? t('promotions.decideAndSend') : isRector ? t('promotions.signAndSend') : t('promotions.addRecommendation')}
                            </button>
                          ))}
                          {canApprove && (
                            <div style={{ width: '100%', marginTop: '8px', padding: '16px', background: 'rgba(79, 70, 229, 0.03)', borderRadius: '16px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--p-indigo)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
                                {t('promotions.finalizeFinancials') || 'Paramètres financiers :'}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>{t('salary.baseSalary') || 'Base (DA)'}</label>
                                  <input type="number" className="mnadm-input" value={newBaseSalary} onChange={e => setNewBaseSalary(e.target.value)} style={{ height: '38px', fontSize: '13px', borderRadius: '10px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  <div>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>{t('salary.hourlyRate') || 'H. Supp'}</label>
                                    <input type="number" className="mnadm-input" value={newHourlyRate} onChange={e => setNewHourlyRate(e.target.value)} style={{ height: '38px', fontSize: '13px', borderRadius: '10px' }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>{t('salary.absencePenalty') || 'Pénalité'}</label>
                                    <input type="number" className="mnadm-input" value={newAbsencePenalty} onChange={e => setNewAbsencePenalty(e.target.value)} style={{ height: '38px', fontSize: '13px', borderRadius: '10px' }} />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleStatusUpdate(p.id, 'Approved', p.requested_grade)}
                                  className="btn-confirm-pro"
                                  style={{ width: '100%', padding: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px', marginTop: '4px', fontWeight: '800' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  {t('promotions.updateFile') || 'Confirmer la Promotion'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {promotions.length === 0 && <tr><td colSpan="5" className="empty-state-cell" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('promotions.noRecords')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default ManagePromotions;
