import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

function ManageDocuments({ user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedType, setRequestedType] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [activeDocId, setActiveDocId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, isBulk: false });
  const { t, locale } = useLanguage();

  const fetchDocuments = async () => {
    setLoading(true);
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch('http://localhost:5000/api/documents', { headers: { 'Authorization': `Bearer ${token}` } }); 
      if (res.ok) setDocuments(await res.json()); 
    } catch (error) { 
      toast.error(t('documents.errorLoading')); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleRequestDocument = async (e) => {
    e.preventDefault(); 
    if (!requestedType) return;
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch('http://localhost:5000/api/documents', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ type: requestedType }) 
      });
      if (res.ok) { 
        toast.success(t('documents.requestSubmitted')); 
        setRequestedType(''); 
        fetchDocuments(); 
      } else { 
        toast.error(t('documents.errorSubmitting')); 
      }
    } catch (error) { 
      toast.error(t('common.serverError')); 
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/documents/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ status, response_note: responseNote }) 
      });
      if (res.ok) { 
        toast.success(`${t('documents.statusUpdated') || 'Status Updated'}`); 
        setActiveDocId(null); 
        setResponseNote(''); 
        fetchDocuments(); 
      } else { 
        toast.error(t('documents.errorUpdating')); 
      }
    } catch (error) { 
      toast.error(t('common.serverError')); 
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({ isOpen: true, id, isBulk: false });
  };

  const performDelete = async () => {
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/documents/${confirmModal.id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) { 
        toast.success(t('common.deleted')); 
        fetchDocuments(); 
      }
    } catch (error) { toast.error(t('common.serverError')); }
    setConfirmModal({ isOpen: false, id: null, isBulk: false });
  };

  const roleUpper = user.role?.toUpperCase() || '';
  const isAdmin = roleUpper.includes('ADMIN');
  const isTeacher = roleUpper.includes('TEACHER') || roleUpper.includes('ENSEIGNANT');
  const isDeptHead = roleUpper.includes('CHEF') || roleUpper.includes('DEPARTMENT') || roleUpper.includes('DEPARTEMENT') || roleUpper.includes('HEAD') || isAdmin;
  const isHR = roleUpper.includes('HR') || roleUpper.includes('RH') || isAdmin;
  const isAuthority = roleUpper.includes('DEAN') || roleUpper.includes('DOYEN') || roleUpper.includes('RECTOR') || roleUpper.includes('RECTEUR') || roleUpper.includes('DIRECTEUR') || isAdmin;

  const translateDocType = (type) => {
    if (!type) return '-';
    const tLower = type.toLowerCase();
    if (tLower.includes('work')) return t('documents.workCert');
    if (tLower.includes('salary') || tLower.includes('paie')) return t('documents.salarySlip');
    if (tLower.includes('teaching')) return t('documents.teachingLoad');
    if (tLower.includes('mission')) return t('documents.missionOrder');
    if (tLower.includes('leave') || tLower.includes('congé')) return t('documents.leaveRequest');
    if (tLower.includes('administrative')) return t('documents.adminCert');
    return type;
  };

  const workflowSteps = [
    { key: 'PENDING', label: t('documents.pending') },
    { key: 'HEAD_APPROVED', label: t('documents.headApproved') },
    { key: 'PROCESSING', label: t('documents.processing') },
    { key: 'HR_APPROVED', label: t('documents.hrApproved') },
    { key: 'SIGNED', label: t('documents.signed') },
    { key: 'AVAILABLE', label: t('documents.available') }
  ];

  const getStepIndex = (status) => {
    const s = (status || 'PENDING').toUpperCase().trim();
    if (s === 'REJECTED') return -1;
    return workflowSteps.findIndex(step => step.key === s);
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || 'PENDING').toUpperCase().trim();
    switch (s) {
      case 'AVAILABLE': return 'badge-pro-success';
      case 'SIGNED': return 'badge-pro-indigo';
      case 'HR_APPROVED': return 'badge-pro-info';
      case 'REJECTED': return 'badge-pro-danger';
      case 'HEAD_APPROVED': 
      case 'PROCESSING': return 'badge-pro-warning';
      case 'PENDING': 
      default: return 'badge-pro-muted';
    }
  };

  const getStatusLabel = (status) => {
    const s = (status || 'PENDING').toUpperCase().trim();
    switch (s) {
      case 'PENDING': return t('documents.pending');
      case 'HEAD_APPROVED': return t('documents.headApproved');
      case 'PROCESSING': return t('documents.processing');
      case 'HR_APPROVED': return t('documents.hrApproved');
      case 'SIGNED': return t('documents.signed');
      case 'AVAILABLE': return t('documents.available');
      case 'REJECTED': return t('documents.rejected');
      default: return status;
    }
  };

  return (
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>
              {isTeacher ? t('documents.myRequests') : t('documents.allRequests')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
              {t('documents.manageTitle')}
            </p>
          </div>
        </div>

        {isTeacher && (
          <form onSubmit={handleRequestDocument} className="card-academic" style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--p-indigo)', color: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>+</div>
              <h4 className="serif" style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>{t('documents.requestNew')}</h4>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label className="mnadm-label">{t('documents.docType')}</label>
                <select className="mnadm-input" value={requestedType} onChange={(e) => setRequestedType(e.target.value)} required style={{ fontWeight: '700' }}>
                  <option value="">{t('documents.selectDocType')}</option>
                  <option value="Work Certificate (Attestation de travail)">{t('documents.workCert')}</option>
                  <option value="Salary Certificate (Attestation de salaire)">{t('documents.salarySlip')}</option>
                  <option value="Leave Request (Demande de congé)">{t('documents.leaveRequest')}</option>
                  <option value="Mission Order (Ordre de mission)">{t('documents.missionOrder')}</option>
                  <option value="Administrative Certificate">{t('documents.adminCert')}</option>
                  <option value="Teaching Load Certificate">{t('documents.teachingLoad')}</option>
                </select>
              </div>
              <button type="submit" className="btn-confirm-pro" style={{ padding: '16px 40px', borderRadius: '14px', fontSize: '15px', fontWeight: '800' }}>{t('documents.submitRequest').toUpperCase()}</button>
            </div>
          </form>
        )}

        {loading ? <div className="loading-spinner" style={{ padding: '40px' }}>{t('documents.loadingRequests')}</div> : (
          <div className="modern-table-wrapper" style={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>{t('common.date')}</th>
                  {!isTeacher && <th>{t('common.teacher')}</th>}
                  <th>{t('documents.docType')}</th>
                  <th style={{ width: '220px' }}>{t('common.status')}</th>
                  <th style={{ textAlign: 'center', width: '200px' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d, index) => {
                  const s = (d.status || 'PENDING').toUpperCase().trim();
                  const currentStepIdx = getStepIndex(s);

                  return (
                    <tr key={d.id} className="table-row-animate">
                      <td style={{ fontWeight: '800', color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ fontWeight: '700', color: '#0f172a' }}>{new Date(d.request_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')}</td>
                      {!isTeacher && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '10px', fontSize: '11px', background: 'linear-gradient(135deg, var(--p-indigo), #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                              {d.nom[0]}{d.prenom[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>{d.nom} {d.prenom}</div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{d.department_name !== 'null' ? d.department_name : '-'}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{translateDocType(d.type)}</div>
                        
                        {/* STEPPER PRO - VISUAL PROGRESS */}
                        {s !== 'REJECTED' && (
                          <div className="stepper-pro" style={{ transform: 'scale(0.85)', transformOrigin: 'left center', margin: '8px 0 0 -10px' }}>
                            {workflowSteps.map((step, idx) => (
                              <div key={step.key} className={`step-item ${idx < currentStepIdx ? 'completed' : idx === currentStepIdx ? 'active' : ''}`}>
                                <div className="step-circle">{idx < currentStepIdx ? '✓' : idx + 1}</div>
                                {idx < workflowSteps.length - 1 && <div className="step-line" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge-pro ${getStatusBadgeClass(d.status)}`} style={{ padding: '6px 12px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {['PENDING', 'HEAD_APPROVED', 'PROCESSING', 'HR_APPROVED'].includes(s) && <span className="status-dot-pulse"></span>}
                          {getStatusLabel(d.status)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          
                          {/* 1. HEAD APPROVAL (PENDING -> HEAD_APPROVED) */}
                          {isDeptHead && s === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleStatusUpdate(d.id, 'HEAD_APPROVED')} className="btn-confirm-pro" style={{ padding: '10px 20px', borderRadius: '14px', background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                {t('common.approve')}
                              </button>
                              <button onClick={() => handleStatusUpdate(d.id, 'REJECTED')} className="btn-delete-pro" style={{ padding: '10px 16px', borderRadius: '14px', background: '#fef2f2' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          )}

                          {/* 2. HR PROCESSING (HEAD_APPROVED -> PROCESSING) */}
                          {isHR && s === 'HEAD_APPROVED' && (
                            <button onClick={() => handleStatusUpdate(d.id, 'PROCESSING')} className="btn-confirm-pro" style={{ padding: '10px 24px', borderRadius: '14px', background: 'var(--p-indigo)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
                              {t('documents.processRequest')}
                            </button>
                          )}

                          {/* 3. HR VALIDATION (PROCESSING -> HR_APPROVED) */}
                          {isHR && s === 'PROCESSING' && (
                            <button onClick={() => setActiveDocId(d.id)} className="btn-confirm-pro" style={{ padding: '10px 24px', borderRadius: '14px', background: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              {t('common.validate')}
                            </button>
                          )}

                          {/* 4. AUTHORITY SIGNATURE (HR_APPROVED -> SIGNED) */}
                          {isAuthority && s === 'HR_APPROVED' && (
                            <button onClick={() => handleStatusUpdate(d.id, 'SIGNED')} className="btn-confirm-pro" style={{ padding: '10px 24px', borderRadius: '14px', background: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              {t('documents.signed')}
                            </button>
                          )}

                          {/* 5. TEACHER COLLECTION (SIGNED -> AVAILABLE) */}
                          {isTeacher && s === 'SIGNED' && (
                            <button onClick={() => handleStatusUpdate(d.id, 'AVAILABLE')} className="btn-confirm-pro" style={{ padding: '10px 24px', borderRadius: '14px', background: '#4338ca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              {t('documents.confirmReceipt')}
                            </button>
                          )}

                          {/* Admin Cleanup */}
                          {isAdmin && (['AVAILABLE', 'REJECTED'].includes(s)) && (
                            <button onClick={() => handleDelete(d.id)} className="btn-delete-pro" style={{ padding: '8px', borderRadius: '8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {documents.length === 0 && <tr><td colSpan={isTeacher ? 5 : 6} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('documents.noRequests')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeDocId && (
        <div className="modal-overlay-academic">
          <div className="card-academic animate-mnadm" style={{ maxWidth: '500px', padding: '40px', borderRadius: '32px' }}>
            <h3 className="serif" style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>{t('documents.processRequest')}</h3>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>{t('documents.processingInstruction')}</p>
            
            <div className="mnadm-form-group" style={{ marginBottom: '32px' }}>
              <label className="mnadm-label">{t('documents.adminNote')}</label>
              <textarea 
                className="mnadm-input" 
                value={responseNote} 
                onChange={(e) => setResponseNote(e.target.value)} 
                rows="4"
                placeholder={t('documents.notePlaceholder')}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleStatusUpdate(activeDocId, 'PROCESSING')} className="btn-confirm-pro" style={{ background: '#f59e0b', flex: 1 }}>
                  {t('documents.processing')}
                </button>
                <button onClick={() => handleStatusUpdate(activeDocId, 'HR_APPROVED')} className="btn-confirm-pro" style={{ flex: 1 }}>
                  {t('documents.hrApproved')}
                </button>
              </div>
              <button onClick={() => { setActiveDocId(null); setResponseNote(''); }} className="btn-cancel-pro" style={{ width: '100%' }}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={t('common.confirmation')}
        message={t('common.confirmDelete')}
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageDocuments;
