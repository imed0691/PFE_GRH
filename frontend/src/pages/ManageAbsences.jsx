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

  const teacherOptions = teachers.map(t => ({ value: t.id, label: `${t.prenom} ${t.nom}` }));

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;

  return (
    <div className="animate-mnadm">
      {(isDeptHead || isAdmin || isHR) && (
        <div className="card-academic" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{t('absences.recordNew')}</h3>
            <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? '#ef4444' : '', color: showForm ? 'white' : '' }}>
              {showForm ? t('common.cancel') : t('absences.recordNew')}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleMarkAbsence} style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>{t('absences.selectPersonnel')}</label>
                <Select options={teacherOptions} value={teacherOptions.find(o => o.value === selectedTeacher)} onChange={o => setSelectedTeacher(o?.value || '')} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>{t('common.date')}</label>
                <input type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>{t('teacher.reason')}</label>
                <input type="text" value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} required placeholder={t('teacher.reason')} />
              </div>
              <button type="submit" style={{ gridColumn: 'span 3' }}>{t('absences.saveRecord')}</button>
            </form>
          )}
        </div>
      )}

      <div className="card-academic">
        <h3 style={{ marginBottom: '24px' }}>{isTeacher ? t('teacher.myAbsenceHistory') : t('absences.personnelAbsences')}</h3>
        <div className="table-academic-wrapper">
          <table className="table-academic">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                {!isTeacher && <th>{t('absences.staffMember')}</th>}
                <th>{t('teacher.reason')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((a) => (
                <tr key={a.id} style={{ transition: 'background 0.2s' }}>
                  <td><div style={{ fontWeight: '600', color: '#1e293b' }}>{new Date(a.date).toLocaleDateString()}</div></td>
                  {!isTeacher && <td><span style={{ fontWeight: '700', color: 'var(--p-indigo)' }}>{a.nom}</span> {a.prenom}</td>}
                  <td>
                    <div style={{ fontWeight: '500', color: '#334155' }}>{a.reason}</div>
                    {a.justification_text && (
                       <div style={{ 
                         fontSize: '12px', 
                         marginTop: '8px', 
                         background: '#f8fafc', 
                         padding: '10px', 
                         borderRadius: '10px',
                         border: '1px solid #e2e8f0',
                         boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                       }}>
                         <div style={{ fontWeight: '700', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>{t('absences.justificationLabel')}</div>
                         <div style={{ color: '#475569', lineHeight: '1.4' }}>{a.justification_text}</div>
                         {a.justification_file && (
                           <a href={`http://localhost:5000/uploads/justifications/${a.justification_file}`} 
                              target="_blank" rel="noreferrer" 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                marginTop: '8px', 
                                color: 'var(--p-indigo)', 
                                fontWeight: '600',
                                textDecoration: 'none',
                                fontSize: '11px',
                                background: '#eef2ff',
                                padding: '4px 8px',
                                borderRadius: '6px'
                              }}>
                             📎 {t('absences.viewAttachment')}
                           </a>
                         )}
                       </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        padding: '6px 12px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        background: a.justification_status === 'Accepted' ? '#dcfce7' : a.justification_status === 'Pending' ? '#fef3c7' : '#fee2e2', 
                        color: a.justification_status === 'Accepted' ? '#166534' : a.justification_status === 'Pending' ? '#92400e' : '#991b1b',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                      }}>
                        {a.justification_status === 'None' ? t('absences.none') : 
                         a.justification_status === 'Pending' ? `⏳ ${t('absences.pending')}` :
                         a.justification_status === 'Accepted' ? `✅ ${t('absences.accepted')}` : `❌ ${t('absences.rejected')}`}
                      </span>
                    </div>
                  </td>
                  <td>
                    {isTeacher && a.justification_status !== 'Accepted' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setActiveJustifyId(a.id)} className="btn-academic-action" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>{t('absences.justify')}</button>
                      </div>
                    )}
                    {(isDeptHead || isHR || isAdmin) && a.justification_status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleJustificationStatus(a.id, 'Accepted')} style={{ padding: '8px 14px', fontSize: '11px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.2)' }}>{t('common.approve').toUpperCase()}</button>
                        <button onClick={() => handleJustificationStatus(a.id, 'Rejected')} style={{ padding: '8px 14px', fontSize: '11px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}>{t('common.reject').toUpperCase()}</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {absences.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{t('absences.noRequests')}</td></tr>}
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
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>{t('absences.justificationText')}</label>
                <textarea value={justificationText} onChange={e => setJustificationText(e.target.value)} required rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700' }}>{t('absences.attachmentLabel')}</label>
                <input type="file" onChange={e => setJustificationFile(e.target.files[0])} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1 }}>
                  {isSubmitting ? t('common.loading') : t('common.submit')}
                </button>
                <button type="button" onClick={() => setActiveJustifyId(null)} disabled={isSubmitting} style={{ flex: 1, background: '#ef4444', color: 'white' }}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAbsences;
