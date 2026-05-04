import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

const gradeHierarchy = ['Teacher', 'MAB', 'MAA', 'MCB', 'MCA', 'Professeur'];

function ManagePromotions({ user }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserGrade, setCurrentUserGrade] = useState(user.grade || 'Teacher');
  const [requestedGrade, setRequestedGrade] = useState('');
  const [file, setFile] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [evaluationScore, setEvaluationScore] = useState('');
  const [showHistory, setShowHistory] = useState(null);
  const [activePromoId, setActivePromoId] = useState(null);
  const [newBaseSalary, setNewBaseSalary] = useState(0);
  const [newHourlyRate, setNewHourlyRate] = useState(0);
  const [newAbsencePenalty, setNewAbsencePenalty] = useState(0);
  const { t } = useLanguage();

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isViceDean = user.role === 'VICE_DEAN' || user.role === 'VICE_DOYEN';
  const isDean = user.role === 'DEAN' || user.role === 'DOYEN';
  const isHR = user.role === 'HR' || user.role === 'RH' || user.role === 'HR_MANAGER' || user.role === 'RH_MANAGER';
  const isViceRector = user.role === 'VICE_RECTOR' || user.role === 'VICE_RECTEUR';
  const isRector = user.role === 'RECTOR' || user.role === 'RECTEUR';

  const fetchCurrentProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUserGrade(data.grade || 'Teacher');
      }
    } catch (e) { console.error('Error fetching profile:', e); }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch('http://localhost:5000/api/promotions', { headers: { 'Authorization': `Bearer ${token}` } }); 
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
      } 
    } catch (error) { 
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
    e.preventDefault(); 
    if (!requestedGrade || !file) return toast.error(t('absences.allFieldsRequired') || 'Tous les champs sont requis');
    
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
        toast.error(errorData.message || t('promotions.errorSubmitting')); 
      }
    } catch (error) { 
      toast.error(t('common.serverError')); 
    }
  };

  const handleRecommendation = async (id) => {
    if (!recommendation) return toast.error(t('promotions.enterRecommendation'));
    
    const payload = { recommendation };
    if (isViceDean) payload.evaluation_score = evaluationScore;

    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/recommend`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify(payload) 
      });
      if (res.ok) { 
        toast.success(t('promotions.recommendationSubmitted')); 
        setRecommendation(''); 
        setEvaluationScore('');
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
        toast.success(status === 'Approved' ? t('promotions.gradeUpdated') : t('promotions.promotionRejected')); 
        fetchPromotions(); 
      } else { 
        toast.error(t('promotions.errorStatus')); 
      }
    } catch (error) { 
      toast.error(t('common.serverError')); 
    }
  };

  const currentGradeIndex = gradeHierarchy.findIndex(g => g.toUpperCase() === currentUserGrade.toUpperCase());
  const availableGrades = currentGradeIndex === -1 ? [] : gradeHierarchy.slice(currentGradeIndex + 1);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Promoted': return { bg: '#dcfce7', color: '#166534', label: t('promotions.statusPromoted') || 'Promoted' };
      case 'Rejected': return { bg: '#fee2e2', color: '#991b1b', label: t('common.rejected') || 'Rejected' };
      case 'Submitted': return { bg: '#fef3c7', color: '#92400e', label: t('promotions.statusSubmitted') || 'Submitted' };
      case 'Head Approved': return { bg: '#dbeafe', color: '#1e40af', label: t('promotions.statusHeadApproved') || 'Head Approved' };
      case 'Pre-validated': return { bg: '#e0e7ff', color: '#3730a3', label: t('promotions.statusPreValidated') || 'Pre-validated' };
      case 'Dean Validated': return { bg: '#f3e8ff', color: '#6b21a8', label: t('promotions.statusDeanValidated') || 'Dean Validated' };
      case 'HR Processed': return { bg: '#fae8ff', color: '#86198f', label: t('promotions.statusHRProcessed') || 'HR Processed' };
      case 'Vice Rector Approved': return { bg: '#f1f5f9', color: '#334155', label: t('promotions.statusViceRectorApproved') || 'Vice Rector Approved' };
      default: return { bg: '#f1f5f9', color: '#475569', label: status };
    }
  };

  return (
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('promotions.title')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>{t('promotions.manageTitle')}</p>

        {isTeacher && (
          currentUserGrade.toUpperCase() === 'PROFESSEUR' ? (
            <div className="card-academic" style={{ background: '#f0fdf4', padding: '32px', borderRadius: '20px', marginBottom: '32px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
               <h4 className="serif" style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '20px' }}>{t('promotions.maxGradeReached')}</h4>
            </div>
          ) : currentGradeIndex === -1 ? (
            <div className="card-academic" style={{ background: '#fff7ed', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #ffedd5', color: '#9a3412', textAlign: 'center' }}>
               <h4 className="serif">{t('promotions.gradeNotRecognized')}</h4>
            </div>
          ) : (
            <form onSubmit={handleRequestPromotion} className="card-academic" style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
              <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
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
                  <label className="mnadm-label">{t('absences.attachmentLabel')}</label>
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
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '13px', color: file ? 'var(--p-indigo)' : '#94a3b8', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      {file ? file.name : (t('common.noFileSelected') || 'Aucun fichier')}
                    </span>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-confirm-pro" style={{ width: '100%', marginTop: '24px' }}>{t('promotions.submitFile').toUpperCase()}</button>
            </form>
          )
        )}

        <div className="modern-table-wrapper" style={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>{t('promotions.candidate')}</th>
                <th style={{ textAlign: 'center' }}>{t('promotions.transition')}</th>
                <th style={{ textAlign: 'center' }}>{t('common.status')}</th>
                <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
                  {promotions.map((p) => {
                    const style = getStatusStyle(p.status);
                    const isViceDean = (user.role === 'VICE_DEAN' || user.role === 'VICE_DOYEN');
                    const isDean = (user.role === 'DEAN' || user.role === 'DOYEN');
                    const isHR = (user.role === 'HR' || user.role === 'RH' || user.role === 'HR_MANAGER' || user.role === 'RH_MANAGER');
                    const isViceRector = (user.role === 'VICE_RECTOR');
                    const isRector = (user.role === 'RECTOR' || user.role === 'RECTEUR');
                    const isDeptHead = (user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT');

                    const canRecommend = 
                      (isDeptHead && p.status === 'Submitted') ||
                      (isViceDean && p.status === 'Head Approved') ||
                      (isHR && p.status === 'Dean Validated');

                    const canFinalize = 
                      (isDean && p.status === 'Pre-validated') ||
                      (isViceRector && p.status === 'HR Processed') ||
                      (isRector && p.status === 'Vice-Rector Approved');

                    return (
                      <tr key={p.id} className="table-row-animate">
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{p.nom} {p.prenom}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '20px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <span className="badge-pro" style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '800' }}>
                                {t(`grades.${p.current_grade}`) === `grades.${p.current_grade}` ? p.current_grade : t(`grades.${p.current_grade}`)}
                            </span>
                            <span style={{ color: '#94a3b8', fontWeight: '900' }}>→</span>
                            <span className="badge-pro" style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', fontSize: '11px', fontWeight: '800' }}>
                                {t(`grades.${p.requested_grade}`) === `grades.${p.requested_grade}` ? p.requested_grade : t(`grades.${p.requested_grade}`)}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '20px 16px' }}>
                          <span className="badge-pro" style={{ background: style.bg, color: style.color, padding: '6px 14px', fontSize: '11px', borderRadius: '10px', fontWeight: '800' }}>
                            {style.label}
                          </span>
                        </td>
                        <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                {p.file_path && (
                                    <button 
                                        onClick={() => window.open(`http://localhost:5000/uploads/promotions/${p.file_path}`, '_blank')} 
                                        className="btn-confirm-pro" 
                                        title={t('absences.viewAttachment')}
                                        style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                    </button>
                                )}

                                {(p.dept_head_recommendation || p.evaluation_score) && (
                                    <button 
                                        onClick={() => setShowHistory(p)} 
                                        className="btn-action-pro" 
                                        title={t('common.details')}
                                        style={{ width: '40px', height: '40px', padding: '0', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                    </button>
                                )}
                                
                                {canRecommend && (
                                    <button 
                                        onClick={() => activePromoId === p.id ? setActivePromoId(null) : setActivePromoId(p.id)} 
                                        className={activePromoId === p.id ? "btn-cancel-pro" : "btn-confirm-pro"}
                                        style={{ padding: '0 16px', height: '40px', fontSize: '11px', fontWeight: '800', borderRadius: '12px', minWidth: '100px' }}
                                    >
                                        {(activePromoId === p.id ? t('common.cancel') : t('common.evaluate')).toUpperCase()}
                                    </button>
                                )}

                                {canFinalize && (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                            onClick={() => handleStatusUpdate(p.id, isRector ? 'Promoted' : (isDean ? 'Dean Validated' : 'Vice-Rector Approved'))} 
                                            className="btn-confirm-pro" 
                                            style={{ height: '40px', padding: '0 16px', fontSize: '11px', fontWeight: '800', borderRadius: '12px' }}
                                        >
                                            {t('common.approve').toUpperCase()}
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(p.id, 'Rejected')} 
                                            className="btn-cancel-pro" 
                                            style={{ height: '40px', padding: '0 16px', fontSize: '11px', fontWeight: '800', borderRadius: '12px' }}
                                        >
                                            {t('common.reject').toUpperCase()}
                                        </button>
                                    </div>
                                )}
                          </div>

                          {activePromoId === p.id && (
                            <div className="card-academic animate-slide-up" style={{ marginTop: '12px', padding: '20px', background: 'white', border: '1px solid var(--p-indigo-light)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'left' }}>
                              <textarea className="mnadm-input" value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder={t('promotions.writeRecommendation')} rows="2" style={{ marginBottom: '12px', fontSize: '13px' }} />
                              {isViceDean && <input type="number" className="mnadm-input" value={evaluationScore} onChange={e => setEvaluationScore(e.target.value)} placeholder="Score / 100" style={{ marginBottom: '12px' }} />}
                              {isHR && (
                                <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                                  <input type="number" placeholder="Salaire Base" onChange={e => setNewBaseSalary(e.target.value)} className="mnadm-input" />
                                  <input type="number" placeholder="Taux Horaire" onChange={e => setNewHourlyRate(e.target.value)} className="mnadm-input" />
                                  <input type="number" placeholder="Pénalité Absence" onChange={e => setNewAbsencePenalty(e.target.value)} className="mnadm-input" />
                                </div>
                              )}
                              <button onClick={() => handleRecommendation(p.id)} className="btn-confirm-pro" style={{ width: '100%', height: '40px', fontWeight: '800' }}>{t('common.approve').toUpperCase()}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Modal History Detail */}
        {showHistory && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="card-academic animate-slide-up" style={{ width: '100%', maxWidth: '600px', padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
                <div style={{ padding: '24px 32px', background: 'var(--p-indigo)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="serif" style={{ margin: 0, fontSize: '20px' }}>{t('common.details')} - {showHistory.nom}</h3>
                    <button onClick={() => setShowHistory(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {showHistory.dept_head_recommendation && (
                            <div style={{ borderLeft: '4px solid var(--p-indigo)', paddingLeft: '16px' }}>
                                <div style={{ fontWeight: '800', color: 'var(--p-indigo)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>{t('roles.DEPARTMENT_HEAD')}</div>
                                <div style={{ color: '#475569', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{showHistory.dept_head_recommendation}</div>
                            </div>
                        )}
                        {showHistory.evaluation_score && (
                            <div style={{ borderLeft: '4px solid #16a34a', paddingLeft: '16px' }}>
                                <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>{t('roles.VICE_DEAN')} ({t('promotions.pendingEvaluation').split(' ')[2]})</div>
                                <div style={{ color: '#16a34a', fontWeight: '800', fontSize: '24px' }}>{showHistory.evaluation_score} / 100</div>
                            </div>
                        )}
                        {showHistory.dean_recommendation && (
                            <div style={{ borderLeft: '4px solid #8b5cf6', paddingLeft: '16px' }}>
                                <div style={{ fontWeight: '800', color: '#8b5cf6', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>{t('roles.DEAN')}</div>
                                <div style={{ color: '#475569', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{showHistory.dean_recommendation}</div>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ padding: '24px 32px', background: '#f8fafc', textAlign: 'right', borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={() => setShowHistory(null)} className="btn-confirm-pro" style={{ padding: '10px 24px' }}>{t('common.close')}</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagePromotions;

