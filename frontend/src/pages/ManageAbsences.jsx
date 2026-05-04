import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

function ManageAbsences({ user: propUser }) {
  const [absences, setAbsences] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const { t } = useLanguage();

  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Justification Form
  const [activeJustifyId, setActiveJustifyId] = useState(null);
  const [justificationText, setJustificationText] = useState('');
  const [justificationFile, setJustificationFile] = useState(null);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (propUser) {
      setUserRole(propUser.role);
      setUserId(propUser.id);
    } else if (storedUser) {
      setUserRole(storedUser.role ? storedUser.role.toUpperCase().replace(/[\s-]/g, '_') : '');
      setUserId(storedUser.id);
    }
  }, [propUser]);

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences?filter=week', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAbsences(data);
        if (isTeacher && data.some(a => !a.is_read_by_teacher)) {
          markAsReadTeacher();
        }
      }
    } catch (error) { toast.error(t('absences.errorLoading')); } finally { setLoading(false); }
  };

  const fetchPastSessions = async () => {
    setLoadingPast(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/sessions/past', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPastSessions(await res.json());
    } catch (e) { console.error(e); } finally { setLoadingPast(false); }
  };

  const markAsReadTeacher = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/absences/read-teacher', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        setTeachers(users.filter(u => {
          const r = u.role ? u.role.toUpperCase().replace(/[\s-]/g, '_') : '';
          return r === 'TEACHER' || r === 'ENSEIGNANT';
        }));
      }
    } catch (error) { console.error('Error fetching teachers:', error); }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDepartments(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchAbsences();
    fetchDepartments();
    if (userRole) {
      const r = userRole.toUpperCase().replace(/[\s-]/g, '_');
      if (r !== 'TEACHER' && r !== 'ENSEIGNANT') {
        fetchTeachers();
        fetchPastSessions();
      }
    }
  }, [userRole]);

  const handleMarkAbsence = async (teacherId, date, reason = t('absences.markAbsence'), startTime, endTime, isExtra) => {
    const loadToast = toast.loading(t('common.loading'));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teacher_id: teacherId, date, reason, start_time: startTime, end_time: endTime, is_extra: isExtra })
      });
      toast.dismiss(loadToast);
      if (res.ok) {
        toast.success(t('absences.statusUpdated'));
        fetchAbsences();
        fetchPastSessions();
      }
    } catch (error) { toast.dismiss(loadToast); toast.error(t('common.serverError')); }
  };

  const handleSubmitJustification = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('justification_text', justificationText);
    if (justificationFile) formData.append('justification_file', justificationFile);

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${activeJustifyId}/justify`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        toast.success(t('absences.justificationSubmitted'));
        setActiveJustifyId(null);
        setJustificationText('');
        setJustificationFile(null);
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); } finally { setIsSubmitting(false); }
  };

  const handleCancelJustification = async (id) => {
    if (!window.confirm(t('absences.confirmCancelJustify'))) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}/justify`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t('absences.justificationCancelled'));
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isTeacher = userRole === 'TEACHER' || userRole === 'ENSEIGNANT';
  const isDeptHead = userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT';
  const isHR = userRole === 'HR' || userRole === 'RH' || userRole === 'HR_MANAGER' || userRole === 'RH_MANAGER';
  const isAdmin = userRole === 'ADMIN';

  const handleJustificationStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ justification_status: status })
      });
      if (res.ok) {
        toast.success(status === 'Accepted' ? t('common.approved') : t('common.rejected'));
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleDeleteAbsence = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t('common.deleted') || 'Absence supprimée');
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleClearHistory = () => {
    const processed = absences.filter(a => a.justification_status !== 'Pending');
    if (processed.length === 0) return toast.info(t('common.noData') || 'Aucune donnée à nettoyer');
    setConfirmModal({ isOpen: true, id: 'all_processed', isBulk: true });
  };

  const performBulkDelete = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t('common.historyCleared') || 'Historique supprimé');
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); } finally { setLoading(false); }
  };

  const filteredTeachers = selectedDept === 'all' 
    ? teachers 
    : teachers.filter(t => t.department_id === parseInt(selectedDept));

  const teacherOptions = filteredTeachers.map(t => ({ 
    value: t.id, 
    label: `${t.prenom} ${t.nom} (${t.department_name || '-'})` 
  }));

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;

  return (
    <>
    <div className="animate-mnadm">
      {(isDeptHead || isAdmin || isHR) && (
        <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div>
                <h3 className="serif" style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{t('absences.recentSessions') || 'Séances récentes à pointer'}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {t('absences.recentSessionsSub') || 'Marquez les absences pour les séances terminées.'}
                </p>
              </div>
            </div>
            <button 
              className="btn-confirm-pro" 
              onClick={fetchPastSessions}
              disabled={loadingPast}
              style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '12px', fontWeight: '800' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              {t('common.refresh') || 'ACTUALISER'}
            </button>
          </div>

          {loadingPast ? (
            <div className="loading-spinner" style={{ padding: '60px' }}>{t('common.loading')}</div>
          ) : pastSessions.length > 0 ? (
            <div className="modern-table-wrapper" style={{ maxHeight: '450px', overflowY: 'auto', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>{t('common.date')}</th>
                    <th>{t('common.module')}</th>
                    <th>{t('absences.staffMember')}</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pastSessions.map((s, idx) => (
                    <tr key={`${s.id}-${idx}`} className="table-row-animate">
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '800', color: 'var(--p-indigo)', fontSize: '14px' }}>{new Date(s.actual_date).toLocaleDateString()}</div>
                        <div style={{ fontWeight: '700', fontSize: '12px', color: '#64748b', marginTop: '4px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>{s.start_time} - {s.end_time}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{s.module_name}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span className="badge-pro" style={{ fontSize: '10px', padding: '2px 8px' }}>{s.session_type}</span>
                          <span className="badge-pro badge-pro-info" style={{ fontSize: '10px', padding: '2px 8px' }}>{s.study_level}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#475569' }}>{s.teacher_prenom} {s.teacher_nom}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-delete-pro" 
                          style={{ padding: '10px 20px', fontSize: '12px', borderRadius: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                          onClick={() => handleMarkAbsence(s.teacher_id, s.actual_date, `Absence au cours de ${s.module_name}`, s.start_time, s.end_time, s.is_extra)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                          {t('absences.markAbsent') || 'MARQUER ABSENT'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '80px 32px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#94a3b8', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <h4 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '18px' }}>{t('absences.allUpToDate') || 'Tout est à jour'}</h4>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>{t('absences.noRecentSessions') || 'Aucune séance récente ne nécessite de pointage.'}</p>
            </div>
          )}
        </div>
      )}

      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{isTeacher ? t('teacher.myAbsenceHistory') : t('absences.personnelAbsences')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0', fontWeight: '500' }}>{t('absences.historyDesc') || 'Suivi et justification des absences.'}</p>
          </div>
          {!isTeacher && (isDeptHead || isHR || isAdmin) && absences.some(a => a.justification_status !== 'Pending') && (
            <button onClick={handleClearHistory} className="btn-delete-pro" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '13px', borderRadius: '12px', fontWeight: '800' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              {t('common.clearHistory') || 'NETTOYER L\'HISTORIQUE'}
            </button>
          )}
        </div>

        <div className="modern-table-wrapper" style={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>{t('common.date')}</th>
                {!isTeacher && <th style={{ width: '220px' }}>{t('absences.staffMember')}</th>}
                <th style={{ minWidth: '250px' }}>{t('teacher.reason')}</th>
                <th style={{ width: '160px', textAlign: 'center' }}>{t('common.status')}</th>
                <th style={{ width: '200px', textAlign: 'center' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((a) => (
                <tr key={a.id} className="table-row-animate">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>{new Date(a.date).toLocaleDateString()}</div>
                      {a.is_extra === 1 && (
                        <span style={{ 
                          fontSize: '9px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', 
                          padding: '2px 8px', borderRadius: '6px', fontWeight: '900', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)', letterSpacing: '0.05em'
                        }}>SUPP</span>
                      )}
                    </div>
                    {a.start_time && <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>{a.start_time.substring(0,5)}</div>}
                  </td>
                  {!isTeacher && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', fontSize: '12px', background: 'linear-gradient(135deg, var(--p-indigo), #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                          {a.nom[0]}{a.prenom[0]}
                        </div>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{a.nom} {a.prenom}</div>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{a.reason}</div>
                    {a.justification_text && (
                      <div style={{ fontSize: '13px', background: '#f8fafc', padding: '16px', borderRadius: '18px', border: '1px solid #e2e8f0', color: '#475569', lineHeight: '1.6', position: 'relative' }}>
                        <div style={{ fontStyle: 'italic', fontWeight: '500' }}>"{a.justification_text}"</div>
                        {a.justification_file && (
                          <a href={`http://localhost:5000/uploads/justifications/${a.justification_file}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--p-indigo)', fontWeight: '800', textDecoration: 'none', fontSize: '11px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s ease' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                            {t('absences.viewAttachment') || 'VOIR JUSTIFICATIF'}
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge-pro ${a.justification_status === 'Accepted' ? 'badge-pro-success' : a.justification_status === 'Pending' ? 'badge-pro-warning' : 'badge-pro-danger'}`} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                      {a.justification_status === 'Pending' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <span className="status-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                          {t('absences.pending')}
                        </span>
                      ) : a.justification_status === 'Accepted' ? t('absences.accepted') : t('absences.rejected')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      {isTeacher && a.justification_status !== 'Accepted' && (
                        <button 
                          onClick={() => {
                            setActiveJustifyId(a.id);
                            if (a.justification_status === 'Pending') setJustificationText(a.justification_text || '');
                          }} 
                          className="btn-confirm-pro" 
                          style={{ padding: '10px 20px', fontSize: '12px', borderRadius: '12px', fontWeight: '800' }}
                        >
                          {a.justification_status === 'Pending' ? (t('absences.updateJustification') || 'MODIFIER') : (t('absences.justify') || 'JUSTIFIER')}
                        </button>
                      )}
                      {(isDeptHead || isHR || isAdmin) && a.justification_status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleJustificationStatus(a.id, 'Accepted')} className="btn-confirm-pro" style={{ padding: '10px 16px', fontSize: '11px', borderRadius: '10px', fontWeight: '900', boxShadow: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </button>
                          <button onClick={() => handleJustificationStatus(a.id, 'Rejected')} className="btn-cancel-pro" style={{ padding: '10px 16px', fontSize: '11px', borderRadius: '10px', fontWeight: '900' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      )}
                      {(isDeptHead || isHR || isAdmin) && a.justification_status !== 'Pending' && (
                        <button onClick={() => setConfirmModal({ isOpen: true, id: a.id })} className="btn-delete-pro" style={{ padding: '10px', borderRadius: '10px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {absences.length === 0 && <tr><td colSpan={isTeacher ? 4 : 5} className="empty-state-cell" style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>{t('absences.noRequests')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {activeJustifyId && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
        <div className="card-academic animate-mnadm" style={{ width: '100%', maxWidth: '550px', padding: '40px', borderTop: '5px solid var(--p-indigo)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div>
              <h3 className="serif" style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{t('absences.justify') || 'Justifier l\'absence'}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{t('absences.justifyDesc') || 'Fournissez un motif et un document justificatif.'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmitJustification}>
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('absences.justificationText') || 'Motif détaillé'}</label>
              <textarea 
                className="mnadm-input" 
                value={justificationText} 
                onChange={e => setJustificationText(e.target.value)} 
                required 
                rows="4" 
                placeholder={t('absences.reasonPlaceholder') || 'Expliquez brièvement la raison de votre absence...'}
                style={{ borderRadius: '16px', padding: '16px', fontWeight: '500' }}
              />
            </div>
            <div className="mnadm-form-group" style={{ marginTop: '24px' }}>
              <label className="mnadm-label">{t('absences.attachmentLabel') || 'Document (PDF, JPG...)'}</label>
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
                    onChange={e => setJustificationFile(e.target.files[0])} 
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: '13px', color: justificationFile ? 'var(--p-indigo)' : '#94a3b8', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>
                  {justificationFile ? justificationFile.name : (t('common.noFileSelected') || 'Aucun fichier')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
              <button type="submit" className="btn-confirm-pro" disabled={isSubmitting} style={{ flex: 1.5, height: '52px', borderRadius: '14px', fontWeight: '900' }}>
                {isSubmitting ? t('common.loading') : (t('common.submit') || 'ENVOYER LA JUSTIFICATION')}
              </button>
              <button type="button" onClick={() => setActiveJustifyId(null)} className="btn-cancel-pro" disabled={isSubmitting} style={{ flex: 1, height: '52px', borderRadius: '14px', fontWeight: '800' }}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    <ConfirmModal 
      isOpen={confirmModal.isOpen}
      message={confirmModal.isBulk ? (t('common.confirmClearAll') || 'Voulez-vous supprimer tout l\'historique traité ?') : t('common.confirmDelete')}
      onConfirm={confirmModal.isBulk ? performBulkDelete : handleDeleteAbsence}
      onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
    />
    </>
  );
}

export default ManageAbsences;
