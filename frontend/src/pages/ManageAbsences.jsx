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
      const res = await fetch('http://localhost:5000/api/absences', {
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

  useEffect(() => {
    fetchAbsences();
    if (userRole) {
      const r = userRole.toUpperCase().replace(/[\s-]/g, '_');
      if (r !== 'TEACHER' && r !== 'ENSEIGNANT') fetchTeachers();
    }
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

  const teacherOptions = teachers.map(t => ({ value: t.id, label: `${t.prenom} ${t.nom}` }));

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;

  return (
    <>
      <div className="animate-mnadm">
        {(isDeptHead || isAdmin || isHR) && (
          <div className="card-academic" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{t('absences.recordNew')}</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className={showForm ? "btn-cancel-pro" : "btn-confirm-pro"} 
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? t('common.cancel') : t('absences.recordNew')}
                </button>
              </div>
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
                      styles={{ control: (base) => ({ ...base, borderRadius: '10px', border: '1px solid #e2e8f0', padding: '4px', fontSize: '14px' }) }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>{isTeacher ? t('teacher.myAbsenceHistory') : t('absences.personnelAbsences')}</h3>
            {!isTeacher && (isDeptHead || isHR || isAdmin) && absences.some(a => a.justification_status !== 'Pending') && (
              <button onClick={handleClearHistory} className="btn-delete-pro" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                {t('common.clearHistory')}
              </button>
            )}
          </div>
          <div className="modern-table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>{t('common.date')}</th>
                  {!isTeacher && <th style={{ width: '220px' }}>{t('absences.staffMember')}</th>}
                  <th style={{ minWidth: '300px' }}>{t('teacher.reason')}</th>
                  <th style={{ width: '160px' }}>{t('common.status')}</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((a) => (
                  <tr key={a.id}>
                    <td><div style={{ fontWeight: '700', color: 'var(--secondary)' }}>{new Date(a.date).toLocaleDateString()}</div></td>
                    {!isTeacher && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="user-avatar-mini" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{a.nom[0]}{a.prenom[0]}</div>
                          <div><div style={{ fontWeight: '800', color: 'var(--p-indigo)' }}>{a.nom}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.prenom}</div></div>
                        </div>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{a.reason}</div>
                      {a.justification_text && (
                        <div style={{ fontSize: '12px', marginTop: '10px', background: 'var(--bg-main)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{a.justification_text}"</div>
                          {a.justification_file && (
                            <a href={`http://localhost:5000/uploads/justifications/${a.justification_file}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', color: 'var(--p-indigo)', fontWeight: '700', textDecoration: 'none', fontSize: '11px', background: 'var(--p-indigo-light)', padding: '6px 12px', borderRadius: '100px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                              {t('absences.viewAttachment')}
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge-pro ${a.justification_status === 'Accepted' ? 'badge-pro-success' : a.justification_status === 'Pending' ? 'badge-pro-warning' : 'badge-pro-danger'}`}>
                        {a.justification_status === 'Pending' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', animation: 'badgePulse 2s infinite' }}>NEW</span>
                            {t('absences.pending')}
                          </span>
                        ) : a.justification_status === 'Accepted' ? t('absences.accepted') : t('absences.rejected')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                        {isTeacher && a.justification_status !== 'Accepted' && (
                          <button onClick={() => setActiveJustifyId(a.id)} className="btn-confirm-pro" style={{ padding: '8px 16px', fontSize: '12px' }}>{t('absences.justify')}</button>
                        )}
                        {(isDeptHead || isHR || isAdmin) && a.justification_status === 'Pending' && (
                          <>
                            <button onClick={() => handleJustificationStatus(a.id, 'Accepted')} className="btn-confirm-pro" style={{ padding: '8px 14px', fontSize: '11px', flex: '1' }}>{t('common.approve').toUpperCase()}</button>
                            <button onClick={() => handleJustificationStatus(a.id, 'Rejected')} className="btn-cancel-pro" style={{ padding: '8px 14px', fontSize: '11px', flex: '1' }}>{t('common.reject').toUpperCase()}</button>
                          </>
                        )}
                        {(isDeptHead || isHR || isAdmin) && a.justification_status !== 'Pending' && (
                          <button onClick={() => setConfirmModal({ isOpen: true, id: a.id })} className="btn-delete-pro" style={{ padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      </div>

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
                <button type="submit" className="btn-confirm-pro" disabled={isSubmitting} style={{ flex: 1 }}>{isSubmitting ? t('common.loading') : t('common.submit')}</button>
                <button type="button" onClick={() => setActiveJustifyId(null)} className="btn-cancel-pro" disabled={isSubmitting} style={{ flex: 1 }}>{t('common.cancel')}</button>
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
