import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

function ManageAbsences({ user: propUser }) {
  const [absences, setAbsences] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const { t } = useLanguage();

  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');

  // Justification Form
  const [activeJustifyId, setActiveJustifyId] = useState(null);
  const [justificationText, setJustificationText] = useState('');
  const [justificationFile, setJustificationFile] = useState(null);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (propUser) {
      setUserRole(propUser.role);
      setUserId(propUser.id);
    } else if (storedUser) {
      setUserRole(storedUser.role);
      setUserId(storedUser.id);
    }
  }, [propUser]);

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAbsences(await res.json());
    } catch (error) { toast.error(t('absences.errorLoading')); } finally { setLoading(false); }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT'));
      }
    } catch (error) { console.error('Error fetching teachers:', error); }
  };

  useEffect(() => {
    fetchAbsences();
    if (userRole && userRole !== 'TEACHER' && userRole !== 'ENSEIGNANT') fetchTeachers();
  }, [userRole]);

  const handleMarkAbsence = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !absenceDate || !absenceReason) return toast.error(t('teacher.allFieldsRequired'));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teacher_id: selectedTeacher, date: absenceDate, reason: absenceReason })
      });
      if (res.ok) {
        toast.success(t('absences.statusUpdated'));
        setShowForm(false);
        setAbsenceReason('');
        setSelectedTeacher('');
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleSubmitJustification = async (e) => {
    e.preventDefault();
    console.log("[ManageAbsences] Submitting justification for ID:", activeJustifyId);
    const formData = new FormData();
    formData.append('justification_text', justificationText);
    if (justificationFile) {
      console.log("[ManageAbsences] Attaching file:", justificationFile.name);
      formData.append('justification_file', justificationFile);
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${activeJustifyId}/justify`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      console.log("[ManageAbsences] Justification response status:", res.status);
      if (res.ok) {
        toast.success(t('absences.justificationSubmitted'));
        setActiveJustifyId(null);
        setJustificationText('');
        setJustificationFile(null);
        fetchAbsences();
      } else {
        const errData = await res.json();
        console.error("[ManageAbsences] Submission failed:", errData);
        toast.error(errData.message || "Submission failed");
      }
    } catch (error) { 
      console.error("[ManageAbsences] Error during submission:", error);
      toast.error(t('common.serverError')); 
    } finally {
      setIsSubmitting(false);
    }
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
        toast.success(`Justification ${status === 'Accepted' ? 'approved' : 'rejected'}`);
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleArchiveAbsence = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}/archive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t('common.deleted') || 'Retiré de la liste');
        fetchAbsences();
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const handleArchiveAllProcessed = async () => {
    const processed = absences.filter(a => a.justification_status !== 'Pending');
    if (processed.length === 0) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      for (const a of processed) {
        await fetch(`http://localhost:5000/api/absences/${a.id}/archive`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      toast.success(t('common.actions') || 'Liste nettoyée');
      fetchAbsences();
    } catch (error) { toast.error(t('common.serverError')); }
    finally { setLoading(false); }
  };

  const teacherOptions = teachers.map(t => ({ value: t.id, label: `${t.prenom} ${t.nom}` }));

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;

  return (
    <div className="animate-mnadm">
      {(isDeptHead || isAdmin || isHR) && (
        <div className="card-academic" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{t('absences.recordNew')}</h3>
            <button 
              className={showForm ? "btn-cancel-pro" : "btn-confirm-pro"} 
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? t('common.cancel') : t('absences.recordNew')}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleMarkAbsence} style={{ marginTop: '24px' }}>
              <div className="mnadm-form-row">
                <div className="mnadm-form-group">
                  <label className="mnadm-label">{t('absences.selectPersonnel')}</label>
                  <Select 
                    options={teacherOptions} 
                    value={teacherOptions.find(o => o.value === selectedTeacher)} 
                    onChange={o => setSelectedTeacher(o?.value || '')} 
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        padding: '4px',
                        fontSize: '14px'
                      })
                    }}
                  />
                </div>
                <div className="mnadm-form-group">
                  <label className="mnadm-label">{t('common.date')}</label>
                  <input type="date" className="mnadm-input" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} required />
                </div>
                <div className="mnadm-form-group">
                  <label className="mnadm-label">{t('teacher.reason')}</label>
                  <input type="text" className="mnadm-input" value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} required placeholder={t('teacher.reason')} />
                </div>
              </div>
              <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '14px' }}>{t('absences.saveRecord')}</button>
            </form>
          )}
        </div>
      )}
      <div className="card-academic">
        <h3 style={{ marginBottom: '24px' }}>{isTeacher ? t('teacher.myAbsenceHistory') : t('absences.personnelAbsences')}</h3>
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>{t('common.date')}</th>
                {!isTeacher && <th style={{ width: '220px' }}>{t('absences.staffMember')}</th>}
                <th style={{ minWidth: '300px' }}>{t('teacher.reason')}</th>
                <th style={{ width: '160px' }}>{t('common.status')}</th>
                <th style={{ width: '200px' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--secondary)' }}>
                      {new Date(a.date).toLocaleDateString()}
                    </div>
                  </td>
                  {!isTeacher && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar-mini" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                          {a.nom[0]}{a.prenom[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--p-indigo)' }}>{a.nom}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.prenom}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{a.reason}</div>
                    {a.justification_text && (
                       <div style={{ 
                         fontSize: '12px', 
                         marginTop: '10px', 
                         background: 'var(--bg-main)', 
                         padding: '12px', 
                         borderRadius: '12px',
                         border: '1px solid var(--border-soft)',
                         boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                       }}>
                         <div style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>"{a.justification_text}"</div>
                         {a.justification_file && (
                           <a href={`http://localhost:5000/uploads/justifications/${a.justification_file}`} 
                              target="_blank" rel="noreferrer" 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                marginTop: '10px', 
                                color: 'var(--p-indigo)', 
                                fontWeight: '700',
                                textDecoration: 'none',
                                fontSize: '11px',
                                background: 'var(--p-indigo-light)',
                                padding: '6px 12px',
                                borderRadius: '100px'
                              }}>
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                             {t('absences.viewAttachment')}
                           </a>
                         )}
                       </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge-pro ${
                      a.justification_status === 'Accepted' ? 'badge-pro-success' : 
                      a.justification_status === 'Pending' ? 'badge-pro-warning' : 'badge-pro-danger'
                    }`}>
                      {a.justification_status === 'None' ? t('absences.none') : 
                       a.justification_status === 'Pending' ? (
                         <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                           }}>NEW</span>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                           {t('absences.pending')}
                         </span>
                       ) : a.justification_status === 'Accepted' ? (
                         <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                           {t('absences.accepted')}
                         </span>
                       ) : (
                         <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                           {t('absences.rejected')}
                         </span>
                       )}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {isTeacher && a.justification_status !== 'Accepted' && (
                        <button onClick={() => setActiveJustifyId(a.id)} className="btn-confirm-pro" style={{ padding: '8px 16px', fontSize: '12px' }}>{t('absences.justify')}</button>
                      )}
                      {(isDeptHead || isHR || isAdmin) && a.justification_status === 'Pending' && (
                        <>
                          <button onClick={() => handleJustificationStatus(a.id, 'Accepted')} className="btn-confirm-pro" style={{ padding: '8px 14px', fontSize: '11px', flex: '1' }}>{t('common.approve').toUpperCase()}</button>
                          <button onClick={() => handleJustificationStatus(a.id, 'Rejected')} className="btn-cancel-pro" style={{ padding: '8px 14px', fontSize: '11px', flex: '1' }}>{t('common.reject').toUpperCase()}</button>
                        </>
                      )}
                      {isDeptHead && a.justification_status !== 'Pending' && (
                         <button 
                           onClick={() => handleArchiveAbsence(a.id)} 
                           className="btn-delete-pro" 
                           title="Retirer de la liste"
                           style={{ padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                         >
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {absences.length === 0 && <tr><td colSpan={isTeacher ? 4 : 5} className="empty-state-cell">{t('absences.noRequests')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL JUSTIFICATION */}
      {activeJustifyId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-academic" style={{ width: '100%', maxWidth: '500px' }}>
            <h3>{t('absences.justify')}</h3>
            <form onSubmit={handleSubmitJustification} style={{ marginTop: '20px' }}>
              <div className="mnadm-form-group">
                <label className="mnadm-label">{t('absences.justificationText')}</label>
                <textarea className="mnadm-input" value={justificationText} onChange={e => setJustificationText(e.target.value)} required rows="3" />
              </div>
              <div className="mnadm-form-group">
                <label className="mnadm-label">{t('absences.attachmentLabel')}</label>
                <input type="file" className="mnadm-input" onChange={e => setJustificationFile(e.target.files[0])} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-confirm-pro" disabled={isSubmitting} style={{ flex: 1 }}>
                  {isSubmitting ? t('common.loading') : t('common.submit')}
                </button>
                <button type="button" onClick={() => setActiveJustifyId(null)} className="btn-cancel-pro" disabled={isSubmitting} style={{ flex: 1 }}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAbsences;
