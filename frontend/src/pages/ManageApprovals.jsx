import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import './ManageApprovals.css';

function ManageApprovals({ user }) {
  const [documents, setDocuments] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const normalizedRole = user.role.toUpperCase().replace(/[-\s]/g, '_');
  const isDeptHead = normalizedRole === 'DEPARTMENT_HEAD' || normalizedRole === 'CHEF_DEPARTEMENT';
  const isViceDean = normalizedRole === 'VICE_DEAN' || normalizedRole === 'VICE_DOYEN';
  const isDean = normalizedRole === 'DEAN' || normalizedRole === 'DOYEN';
  const isHR = normalizedRole === 'HR' || normalizedRole === 'RH' || normalizedRole === 'HR_MANAGER' || normalizedRole === 'RH_MANAGER';
  const isViceRector = normalizedRole === 'VICE_RECTOR' || normalizedRole === 'VICE_RECTEUR';
  const isRector = normalizedRole === 'RECTOR' || normalizedRole === 'RECTEUR';
  
  const isHighAuthority = ['DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN', 'RECTOR', 'RECTEUR'].some(r => normalizedRole === r);

  const [activeTab, setActiveTab] = useState('documents');
  // Modal States for Promotions
  const [showHistory, setShowHistory] = useState(null);
  const [activePromoId, setActivePromoId] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [evaluationScore, setEvaluationScore] = useState('');
  const [newBaseSalary, setNewBaseSalary] = useState(0);
  const [newHourlyRate, setNewHourlyRate] = useState(0);
  const [newAbsencePenalty, setNewAbsencePenalty] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resDocs, resProms] = await Promise.all([
        fetch('http://localhost:5000/api/documents', { headers }),
        fetch('http://localhost:5000/api/promotions', { headers })
      ]);

      if (resDocs.ok) {
        const data = await resDocs.json();
        const role = user.role.toUpperCase();

        // Filter based on who acts next
        let pendingDocs = [];
        if (role.includes('CHEF') || role.includes('HEAD')) {
          pendingDocs = data.filter(d => (d.status || '').toUpperCase().trim() === 'PENDING');
        } else if (role.includes('HR') || role.includes('RH')) {
          pendingDocs = data.filter(d => ['HEAD_APPROVED', 'PROCESSING'].includes((d.status || '').toUpperCase().trim()));
        } else if (['DEAN', 'DOYEN', 'RECTOR', 'RECTEUR'].some(r => role.includes(r))) {
          const isRector = ['RECTOR', 'RECTEUR', 'ADMIN'].some(r => role.includes(r));
          const isDean = ['DEAN', 'DOYEN', 'ADMIN'].some(r => role.includes(r));

          pendingDocs = data.filter(d => {
            const s = (d.status || '').toUpperCase().trim();
            if (s !== 'HR_APPROVED') return false;

            const type = (d.type || '').toLowerCase();
            // Rector Only
            if (type.includes('mission')) return isRector;
            // Dean Only
            if (type.includes('leave') || type.includes('congé') || type.includes('administrative') || type.includes('teaching')) return isDean;
            // Both
            return isRector || isDean;
          });
        } else if (role === 'ADMIN') {
          pendingDocs = data.filter(d => !['SIGNED', 'AVAILABLE', 'REJECTED'].includes((d.status || '').toUpperCase().trim()));
        }

        setDocuments(pendingDocs);
      }
      if (resProms.ok) {
        const data = await resProms.json();
        // Backend already handles role-based filtering, so we show everything returned
        setPromotions(data);
      }
    } catch (error) {
      toast.error(t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

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
  const getCleanContent = (raw, roleKey) => {
    if (!raw) return null;
    const markerPatterns = {
      chef: /(?:^|\n)\s*\bChef\s*D[.\u00e9e]pt\b\s*:?/i,
      vd: /(?:^|\n)\s*\bVice-Doyen\b\s*:?/i,
      dean: /(?:^|\n)\s*\bDoyen\b\s*:?/i,
      rh: /(?:^|\n)\s*\bRH\b\s*:?/i,
      vr: /(?:^|\n)\s*\bVice-Recteur\b\s*:?/i,
      rector: /(?:^|\n)\s*(?<!Vice-)\bRecteur\b\s*:?/i
    };
    const allMarkersRegex = /(?:^|\n)\s*(\bChef\s*D[.\u00e9e]pt\b|\bVice-Doyen\b|\bDoyen\b|\bRH\b|\bVice-Recteur\b|\bRecteur\b)\s*:?/i;
    
    const match = raw.match(markerPatterns[roleKey]);
    if (!match) return null;
    
    const matchIndex = match.index + (match[0].startsWith('\n') ? 1 : 0);
    let content = raw.substring(matchIndex + match[0].replace(/^(?:\n)?\s*/, '').length);
    const nextMarkerMatch = content.match(allMarkersRegex);
    if (nextMarkerMatch) content = content.substring(0, nextMarkerMatch.index);
    
    return content.trim().replace(/^[:\s\-]+/, '').trim() || null;
  };


  useEffect(() => {
    fetchData();
  }, []);

  const handleDocAction = async (doc, isApprove) => {
    try {
      const token = localStorage.getItem('token');
      const role = user.role.toUpperCase().replace(/[-\s]/g, '_');
      const currentStatus = (doc.status || '').toUpperCase().trim();
      let nextStatus = 'REJECTED';

      if (isApprove) {
        if (currentStatus === 'PENDING') nextStatus = 'HEAD_APPROVED';
        else if (currentStatus === 'HR_APPROVED') nextStatus = 'SIGNED';
        else if (role === 'ADMIN') {
          // Admin override
          if (currentStatus === 'PENDING') nextStatus = 'HEAD_APPROVED';
          else if (currentStatus === 'HEAD_APPROVED') nextStatus = 'PROCESSING';
          else if (currentStatus === 'PROCESSING') nextStatus = 'HR_APPROVED';
          else if (currentStatus === 'HR_APPROVED') nextStatus = 'SIGNED';
        }
      }

      const res = await fetch(`http://localhost:5000/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        toast.success(isApprove ? 'Status Updated' : 'Document Rejected');
        fetchData();
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleRecommendation = async (id) => {
    if (!recommendation) return toast.error(t('promotions.enterRecommendation') || 'Please enter a recommendation');

    try {
      const token = localStorage.getItem('token');
      const isViceDean = normalizedRole === 'VICE_DEAN' || normalizedRole === 'VICE_DOYEN';

      const payload = { recommendation };
      if (isViceDean) payload.evaluation_score = evaluationScore;

      const res = await fetch(`http://localhost:5000/api/promotions/${id}/recommend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(t('promotions.recommendationSubmitted') || 'Recommendation submitted');
        setRecommendation('');
        setEvaluationScore('');
        setActivePromoId(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handlePromAction = async (id, isApprove) => {
    try {
      const token = localStorage.getItem('token');
      const role = user.role.toUpperCase().replace(/[-\s]/g, '_');

      // If it's Rector, use the 'status' endpoint to finalize
      // Others use 'recommend' to move to next level
      // Use exact match or check for 'VICE_' prefix to avoid partial match (VICE_RECTOR vs RECTOR)
      const isRector = (role === 'RECTOR' || role === 'RECTEUR');
      const endpoint = isRector ? 'status' : 'recommend';
      const body = isApprove
        ? (isRector ? { status: 'Approved' } : { recommendation: 'Approved at Administrative Level', evaluation_score: 20 })
        : { status: 'Rejected' };

      const res = await fetch(`http://localhost:5000/api/promotions/${id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success(isApprove ? 'Promotion Validated' : 'Promotion Rejected');
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Server error' }));
        toast.error(`Error (${res.status}): ${errorData.message}`);
      }
    } catch (error) {
      toast.error('Connection failed. Please check your network.');
    }
  };
  return (
    <div className="approvals-container animate-mnadm">
      <div className="approvals-header-premium">
        <div className="header-text">
          <h2 className="academic-title">{t('sidebar.approvals_and_promotions') || 'Approvals & Promotions'}</h2>
          <p className="academic-subtitle">Centralized administrative validation and academic career tracking center</p>
        </div>
        
        <div className="approval-tabs-wrapper">
          <button 
            className={`approval-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <div className="tab-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </div>
            <span>Document Requests</span>
            <span className="tab-count">{documents.length}</span>
          </button>
          <button 
            className={`approval-tab ${activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => setActiveTab('promotions')}
          >
            <div className="tab-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <span>Promotion Files</span>
            <span className="tab-count">{promotions.length}</span>
          </button>
        </div>
      </div>

      <div className="approval-content-area card-academic">
        {activeTab === 'documents' ? (
          <div className="tab-pane-pro animate-slide-up">
            <div className="pane-header">
               <h3 className="academic-title" style={{ fontSize: '18px' }}>Pending Document Validations</h3>
            </div>
            
            {documents.length === 0 ? (
              <div className="empty-state-pro">No document requests awaiting your signature.</div>
            ) : (
              <div className="table-responsive-pro">
                <table className="modern-fixed-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Staff Member</th>
                      <th style={{ width: '30%' }}>Document Type</th>
                      <th style={{ width: '20%' }}>Submission Date</th>
                      <th style={{ width: '25%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div className="candidate-name">{doc.user_name || 'Staff Member'}</div>
                          <div className="candidate-id">User ID: #{doc.user_id}</div>
                        </td>
                        <td>
                          <span className="badge-pro" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {doc.type}
                          </span>
                        </td>
                        <td className="date-col">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="actions-col">
                          <div className="flex-actions-end">
                            <button className="btn-confirm-pro btn-mini" onClick={() => handleDocAction(doc, true)}>APPROVE</button>
                            <button className="btn-cancel-pro btn-mini" onClick={() => handleDocAction(doc, false)}>REJECT</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="tab-pane-pro animate-slide-up">
             <div className="pane-header">
               <h3 className="academic-title" style={{ fontSize: '18px' }}>Active Promotion Tracking</h3>
            </div>

            {promotions.length === 0 ? (
              <div className="empty-state-pro" style={{ padding: '60px' }}>No promotion files currently require your action.</div>
            ) : (
              <div className="table-responsive-pro">
                <table className="modern-fixed-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}><div>{t('promotions.candidate')}</div></th>
                      <th style={{ width: '35%' }}><div>{t('promotions.transition')}</div></th>
                      <th style={{ width: '20%' }}><div>STATUS</div></th>
                      <th style={{ width: '30%' }}><div>ACTIONS</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map(prom => {
                      const st = getStatusStyle(prom.status);
                      return (
                        <tr key={prom.id}>
                          <td style={{ width: '15%' }}>
                            <div className="candidate-name">{prom.nom} {prom.prenom}</div>
                          </td>
                          <td style={{ width: '35%' }}>
                            <div className="transition-badges">
                                <span className="badge-pro grade-old">
                                    {t(`grades.${prom.current_grade}`) === `grades.${prom.current_grade}` ? prom.current_grade : t(`grades.${prom.current_grade}`)}
                                </span>
                                <span className="arrow-pro">→</span>
                                <span className="badge-pro grade-new">
                                    {t(`grades.${prom.requested_grade}`) === `grades.${prom.requested_grade}` ? prom.requested_grade : t(`grades.${prom.requested_grade}`)}
                                </span>
                            </div>
                          </td>
                          <td style={{ width: '20%' }}>
                            <div>
                                <span className="badge-pro" style={{ background: st.bg, color: st.color }}>
                                    <span className="status-dot-pulse"></span>
                                    {st.label}
                                </span>
                            </div>
                          </td>
                          <td style={{ width: '30%' }}>
                            <div className="flex-actions-end">
                              {prom.file_path && (
                                  <button onClick={() => window.open(`http://localhost:5000/uploads/promotions/${prom.file_path}`, '_blank')} className="btn-icon-only">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                  </button>
                              )}
                              <button onClick={() => setShowHistory(prom)} className="btn-icon-only">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                              </button>
                              {((isDeptHead && prom.status === 'Submitted') ||
                                (isViceDean && prom.status === 'Head Approved') ||
                                (isHR && prom.status === 'Dean Validated') ||
                                (isViceRector && prom.status === 'HR Processed')) && (
                                <button 
                                  onClick={() => { setActivePromoId(prom.id); setRecommendation(''); }}
                                  className="btn-confirm-pro btn-evaluate"
                                >
                                  {(activePromoId === prom.id ? t('common.cancel') : t('promotions.evaluate')).toUpperCase()}
                                </button>
                              )}

                              {((isDean && prom.status === 'Pre-validated') ||
                                (isRector && prom.status === 'Vice Rector Approved')) && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handlePromAction(prom.id, true)} className="btn-confirm-pro">
                                    {t('common.approve').toUpperCase()}
                                  </button>
                                  <button onClick={() => handlePromAction(prom.id, false)} className="btn-cancel-pro">
                                    {t('common.reject').toUpperCase()}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Promotion Modals Portals */}
      {activePromoId && createPortal(
        <div className="modal-overlay-academic" onClick={() => setActivePromoId(null)}>
          <div className="modal-content-academic animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header-academic">
              <h3>{t('promotions.evaluate')}</h3>
              <button className="btn-close-modal" onClick={() => setActivePromoId(null)}>&times;</button>
            </div>
            <div className="modal-body-academic" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>{t('promotions.writeRecommendation')}</label>
                <textarea 
                  className="mnadm-input" 
                  value={recommendation} 
                  onChange={e => setRecommendation(e.target.value)} 
                  placeholder="Write your official recommendation..." 
                  rows="4" 
                  style={{ width: '100%', resize: 'none' }} 
                />
              </div>

              {isViceDean && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>Evaluation Score (/100)</label>
                  <input type="number" className="mnadm-input" value={evaluationScore} onChange={e => setEvaluationScore(e.target.value)} placeholder="0 - 100" />
                </div>
              )}

              <button 
                onClick={() => handleRecommendation(activePromoId)} 
                className="btn-confirm-pro" 
                style={{ width: '100%', height: '48px', fontWeight: '800', marginTop: '12px' }}
              >
                {t('common.approve').toUpperCase()}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showHistory && createPortal(
        <div className="modal-overlay-academic" onClick={() => setShowHistory(null)}>
          <div className="modal-content-academic animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header-academic" style={{ background: 'var(--p-indigo)', color: 'white' }}>
                  <h3 style={{ color: 'white' }}>{t('common.details')} - {showHistory.nom}</h3>
                  <button className="btn-close-modal" onClick={() => setShowHistory(null)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>&times;</button>
              </div>
              
              <div className="modal-body-academic" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', background: '#f1f5f9', zIndex: 1 }}></div>
                      
                      {(() => {
                          const statusMap = {
                            'SUBMITTED': 0, 'HEAD APPROVED': 1, 'PRE-VALIDATED': 2, 'DEAN VALIDATED': 3,
                            'HR PROCESSED': 4, 'VICE RECTOR APPROVED': 5, 'PROMOTED': 6
                          };
                          const steps = [
                            { key: 'chef', label: t('roles.DEPARTMENT_HEAD'), color: '#6366f1', activeBg: '#f5f7ff', activeBorder: '#6366f1' },
                            { key: 'vd', label: t('roles.VICE_DEAN'), color: '#22c55e', activeBg: '#f0fdf4', activeBorder: '#22c55e' },
                            { key: 'dean', label: t('roles.DEAN'), color: '#8b5cf6', activeBg: '#f5f3ff', activeBorder: '#8b5cf6' },
                            { key: 'rh', label: t('roles.HR_MANAGER'), color: '#f59e0b', activeBg: '#fffbeb', activeBorder: '#f59e0b' },
                            { key: 'vr', label: t('roles.VICE_RECTOR'), color: '#ec4899', activeBg: '#fdf2f8', activeBorder: '#ec4899' },
                            { key: 'rector', label: t('roles.RECTOR'), color: '#0f172a', activeBg: '#f1f5f9', activeBorder: '#0f172a' }
                          ];

                          let normalizedStatus = (showHistory.status || 'SUBMITTED').toUpperCase().trim();
                          if (normalizedStatus === 'APPROVED' || normalizedStatus === 'FINAL APPROVED' || normalizedStatus === 'FINAL_PROMOTED') {
                            normalizedStatus = 'PROMOTED';
                          }
                          const currentStepIdx = statusMap[normalizedStatus] ?? 0;

                          return steps.map((step, idx) => {
                            const val = getCleanContent(showHistory.dept_head_recommendation, step.key) || (step.key === 'vd' && showHistory.evaluation_score ? `Score: ${showHistory.evaluation_score} / 100` : null);
                            let displayVal = val;
                            const isCompleted = currentStepIdx > idx;
                            const isActive = currentStepIdx === idx;
                            const isPending = currentStepIdx < idx;

                            if (step.key === 'rh' && isCompleted) displayVal = 'DOSSIER ADMINISTRATIF VÉRIFIÉ ET CONFORME';

                            return (
                              <div key={idx} style={{ position: 'relative', zIndex: 2, paddingLeft: '44px', opacity: isPending ? 0.5 : 1, marginBottom: '24px' }}>
                                {/* Circle */}
                                <div style={{
                                  position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px',
                                  background: (isCompleted || isActive) ? step.color : '#e2e8f0',
                                  borderRadius: '50%', border: '5px solid white',
                                  boxShadow: isActive ? `0 0 0 4px ${step.color}30` : (isCompleted ? '0 0 0 1px #e2e8f0' : 'none'),
                                  zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {isCompleted && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>

                                {/* Label */}
                                <div style={{ fontWeight: '800', color: isActive ? '#1e293b' : (isCompleted ? '#64748b' : '#cbd5e1'), fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                  {step.label} {isCompleted && <span style={{ color: '#22c55e', marginLeft: '8px', fontSize: '10px' }}>✓</span>}
                                </div>

                                {/* Content Box */}
                                <div style={{
                                  background: isActive ? step.activeBg : (isCompleted ? '#ffffff' : '#fafafa'),
                                  padding: '16px 20px', borderRadius: '16px',
                                  border: isActive ? `2px solid ${step.activeBorder}` : (isCompleted ? '1px solid #e2e8f0' : '1px dashed #f1f5f9'),
                                  color: isActive ? step.color : (isCompleted ? '#475569' : '#cbd5e1'),
                                  fontSize: '14px', fontWeight: isActive ? '700' : '500', minHeight: '52px',
                                  display: 'flex', alignItems: 'center', transition: 'all 0.3s'
                                }}>
                                  {displayVal || (isActive ? <span style={{ color: step.color, fontStyle: 'italic' }}>Waiting for validation...</span> : <span style={{ fontStyle: 'italic' }}>---</span>)}
                                </div>
                              </div>
                            );
                          });
                      })()}
                  </div>
              </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ManageApprovals;
