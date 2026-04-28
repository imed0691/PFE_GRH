import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './DashboardTeacher.css';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';

function DashboardTeacher({ user, onLogout }) {
  const [data, setData] = useState({
    all_sessions: [],
    stats: { volume_horaire: 0, heures_assurees: 0, absences: 0 },
    reminders: [],
    my_absences: []
  });
  const [loading, setLoading] = useState(true);
  const [view, setViewRaw] = useState('schedule');
  const { badges, markSeen } = useNotificationBadges();
  const { t, locale } = useLanguage();

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => {
    setViewRaw(newView);
    if (badges[newView] && badges[newView] > 0) {
      markSeen(newView);
    }
  };
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceDate, setAbsenceDate] = useState('');
  const [expandedReasons, setExpandedReasons] = useState({});

  const toggleReason = (id) => {
    setExpandedReasons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [activeJustify, setActiveJustify] = useState(null);
  const [activeCatchup, setActiveCatchup] = useState(null);
  const [justificationText, setJustificationText] = useState('');
  const [catchupData, setCatchupData] = useState({ date: '', startTime: '', endTime: '' });

  const handleJustify = async (id) => {
    if (!justificationText) return toast.error(t('teacher.allFieldsRequired'));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}/justify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ justification_text: justificationText })
      });
      if (res.ok) {
        toast.success(t('absences.justificationSubmitted'));
        setActiveJustify(null);
        setJustificationText('');
        fetchDashboardData();
      } else {
        toast.error(t('absences.errorUpdating'));
      }
    } catch (e) { toast.error(t('common.serverError')); }
  };

  const handleCatchup = async (id) => {
    if (!catchupData.date || !catchupData.startTime || !catchupData.endTime) return toast.error(t('teacher.allFieldsRequired'));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}/catchup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          catchup_date: catchupData.date,
          catchup_start_time: catchupData.startTime,
          catchup_end_time: catchupData.endTime
        })
      });
      if (res.ok) {
        toast.success(t('absences.catchupSubmitted'));
        setActiveCatchup(null);
        setCatchupData({ date: '', startTime: '', endTime: '' });
        fetchDashboardData();
      } else {
        toast.error(t('absences.errorUpdating'));
      }
    } catch (e) { toast.error(t('common.serverError')); }
  };

  const unreadRemindersCount = data.reminders ? data.reminders.filter(r => !r.is_read).length : 0;
  const unreadAbsencesCount = data.my_absences ? data.my_absences.filter(a => !a.is_read_by_teacher).length : 0;

  const markRemindersAsRead = async () => {
    if (!data.reminders || data.reminders.length === 0 || unreadRemindersCount === 0) return;
    const unreadIds = data.reminders.filter(r => !r.is_read).map(r => r.id);
    if (unreadIds.length === 0) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/reminders/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reminderIds: unreadIds })
      });
      setData(prev => ({ ...prev, reminders: prev.reminders.map(r => ({ ...r, is_read: true })) }));
    } catch (e) { console.error(e); }
  };

  const markAbsencesAsRead = async () => {
    if (!data.my_absences || data.my_absences.length === 0 || unreadAbsencesCount === 0) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/absences/read-teacher', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setData(prev => ({ ...prev, my_absences: prev.my_absences.map(a => ({ ...a, is_read_by_teacher: true })) }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (view === 'reminders') markRemindersAsRead();
    if (view === 'absences') markAbsencesAsRead();
  }, [view, data.reminders, data.my_absences]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/teacher/dashboard/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error(t('teacher.failedLoadDashboard'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [user.id]);

  // Notification toast on load
  useEffect(() => {
    if (loading) return;
    const unreadR = data.reminders ? data.reminders.filter(r => !r.is_read).length : 0;
    const unreadA = data.my_absences ? data.my_absences.filter(a => !a.is_read_by_teacher).length : 0;
    const total = unreadR + unreadA;
    if (total > 0) {
      toast(
        () => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
              <strong>{t('teacher.unreadNotif').replace('{count}', total)}</strong>
              {unreadR > 0 && <div style={{ fontSize: '12px', color: '#64748b' }}>{t('teacher.adminMessages').replace('{count}', unreadR)}</div>}
              {unreadA > 0 && <div style={{ fontSize: '12px', color: '#64748b' }}>{t('teacher.absenceUpdates').replace('{count}', unreadA)}</div>}
            </div>
          </div>
        ),
        { duration: 5000, style: { background: '#eff6ff', border: '1px solid #3b82f6', color: '#1e3a8a', borderRadius: '12px', padding: '14px 18px' }, icon: null }
      );
    }
  }, [loading]);

  const handleReportAbsence = async (e) => {
    e.preventDefault();
    if (!absenceDate || !absenceReason) return toast.error(t('teacher.allFieldsRequired'));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teacher_id: user.id, date: absenceDate, reason: absenceReason })
      });
      if (res.ok) {
        toast.success(t('teacher.absenceRequestSent'));
        setAbsenceReason(''); setAbsenceDate('');
        fetchDashboardData();
      } else {
        toast.error(t('teacher.errorSendingRequest'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reminders/${id}/hide`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
        toast.success(t('teacher.reminderDeleted'));
      }
    } catch (error) {
      toast.error(t('teacher.errorDeletingReminder'));
    }
  };

  const handleClearAllReminders = async () => {
    if (!data.reminders || data.reminders.length === 0) return;
    const allIds = data.reminders.map(r => r.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reminders/hide-all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reminderIds: allIds })
      });
      if (res.ok) {
        setData(prev => ({ ...prev, reminders: [] }));
        toast.success(t('teacher.allRemindersCleared'));
      }
    } catch (error) {
      toast.error(t('teacher.errorClearingReminders'));
    }
  };

  const volumeRestant = data.stats.volume_horaire - data.stats.heures_assurees;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>PFE_GRH</h2>
        </div>
        <div className="user-profile">
          <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role">{t('roles.TEACHER')}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}>{t('sidebar.mySchedule')}</button>
          <button className={`nav-item ${view === 'absences' ? 'active' : ''}`} onClick={() => setView('absences')}>{t('sidebar.absences')} <NotifBadge count={unreadAbsencesCount || badges.absences} /></button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.reminders')} <NotifBadge count={unreadRemindersCount} /></button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => setView('promotions')}>{t('sidebar.promotions')} <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => setView('documents')}>{t('sidebar.documents')} <NotifBadge count={badges.documents} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => setView('evaluations')}>{t('sidebar.evaluations')} <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>
            {view === 'schedule' ? t('topbar.mySchedule') :
              view === 'absences' ? t('topbar.absencesManagement') :
                view === 'promotions' ? t('topbar.careerAdvancements') :
                  view === 'documents' ? t('topbar.administrativeDocuments') :
                    view === 'evaluations' ? t('topbar.myEvaluations') :
                      view === 'settings' ? t('settings.title') :
                          t('topbar.remindersCommunications')}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {loading ? (
            <div className="loading-spinner">{t('teacher.loadingDashboard')}</div>
          ) : (
            <>
              {view === 'schedule' && (
                <>
                  <div className="dashboard-widgets">
                    <div className="widget">
                      <div className="widget-info">
                        <h4>{t('teacher.remainingHours')}</h4>
                        <p>{volumeRestant}h <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>/ {data.stats.volume_horaire}h</span></p>
                      </div>
                    </div>
                    <div className="widget">
                      <div className="widget-info">
                        <h4>{t('teacher.completedHours')}</h4>
                        <p>{data.stats.heures_assurees}h</p>
                      </div>
                    </div>
                  </div>
                  <div className="table-card">
                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>{t('teacher.weeklySchedule')}</h3>
                    {data.all_sessions && data.all_sessions.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="modern-table">
                          <thead>
                            <tr>
                              <th>{t('teacher.day')}</th>
                              <th>{t('teacher.time')}</th>
                              <th>{t('teacher.module')}</th>
                              <th>{t('teacher.level')}</th>
                              <th>{t('teacher.type')}</th>
                              <th>{t('teacher.sectionGroup')}</th>
                              <th>{t('common.department')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.all_sessions.map(s => (
                              <tr key={s.id}>
                                <td><strong>{s.day_of_week}</strong></td>
                                <td>{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</td>
                                <td>{s.module_name}</td>
                                <td><span className="role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{s.study_level}</span></td>
                                <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{s.session_type === 'Lecture' ? t('teacher.lecture') : s.session_type === 'Tutorial' ? t('teacher.tutorial') : t('teacher.practical')}</span></td>
                                <td>
                                  {(s.section || s.groupe) ? (
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>
                                      {s.section && `Sec: ${s.section}`} {s.groupe && `Grp: ${s.groupe}`}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td>{s.department_name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                        {t('teacher.noSessions')}
                      </div>
                    )}
                  </div>
                </>
              )}

              {view === 'absences' && (
                <>
                  <div className="dashboard-widgets">
                    <div className="widget" style={{ borderLeft: '4px solid #ef4444' }}>
                      <div className="widget-info">
                        <h4>{t('teacher.totalApprovedAbsences')}</h4>
                        <p style={{ color: data.stats.absences > 0 ? '#ef4444' : '#10b981' }}>{data.stats.absences}</p>
                      </div>
                    </div>
                  </div>
                  <div className="table-card">
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{t('teacher.myAbsenceHistory')}</h3>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>{t('common.date')}</th>
                          <th>{t('teacher.reason')}</th>
                          <th>{t('absences.justified')}</th>
                          <th>{t('absences.caughtUp')}</th>
                          <th>{t('absences.penaltySalary')}</th>
                          <th>{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.my_absences && data.my_absences.map(a => {
                          const hasPenalty = !a.has_justification && !a.is_caught_up;
                          return (
                            <tr key={a.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {!a.is_read_by_teacher && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>}
                                  {new Date(a.date).toLocaleDateString(locale)}
                                </div>
                              </td>
                              <td>{a.reason}</td>
                              <td><span className="role-tag" style={{ background: a.has_justification ? '#d1fae5' : '#fee2e2', color: a.has_justification ? '#065f46' : '#991b1b' }}>{a.has_justification ? t('common.yes') : t('common.no')}</span></td>
                              <td><span className="role-tag" style={{ background: a.is_caught_up ? '#dbeafe' : '#fef3c7', color: a.is_caught_up ? '#1e40af' : '#92400e' }}>{a.is_caught_up ? t('common.yes') : t('common.no')}</span></td>
                              <td><span style={{ color: hasPenalty ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{hasPenalty ? t('common.yes') : t('common.no')}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  {!a.has_justification && (
                                    <button onClick={() => setActiveJustify(a.id)} className="btn-small" style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                      {t('absences.justify')}
                                    </button>
                                  )}
                                  {!a.is_caught_up && (
                                    <button onClick={() => setActiveCatchup(a.id)} className="btn-small" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                      {t('absences.catchUp')}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {(!data.my_absences || data.my_absences.length === 0) && (
                          <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>{t('teacher.noAbsenceRecords')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {view === 'promotions' && <ManagePromotions user={user} />}
              {view === 'documents' && <ManageDocuments user={user} />}
              {view === 'evaluations' && <ManageEvaluations user={user} />}
              {view === 'settings' && <Settings user={user} onProfileUpdate={handleProfileUpdate} />}

              {view === 'reminders' && (
                <div className="table-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>{t('teacher.communicationsFromHR')}</h3>
                    {data.reminders && data.reminders.length > 0 && (
                      <button onClick={handleClearAllReminders} style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        {t('teacher.clearAll')}
                      </button>
                    )}
                  </div>
                  {data.reminders && data.reminders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {data.reminders.map(r => (
                        <div key={r.id} style={{ padding: '15px 20px', borderRadius: '8px', borderLeft: `4px solid ${r.type === 'error' ? '#ef4444' : r.type === 'warning' ? '#f59e0b' : '#3b82f6'}`, background: r.type === 'error' ? '#fef2f2' : r.type === 'warning' ? '#fffbeb' : '#eff6ff' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: r.type === 'error' ? '#991b1b' : r.type === 'warning' ? '#92400e' : '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              {!r.is_read && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>}
                              <span>{r.type === 'error' ? t('teacher.urgent') : r.type === 'warning' ? t('teacher.important') : t('teacher.information')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              {r.sender_nom && (
                                <span style={{ fontSize: '0.85em', fontWeight: 'normal', color: '#64748b' }}>
                                  {t('common.from')}: {r.sender_prenom} {r.sender_nom} ({r.sender_role})
                                </span>
                              )}
                              <button onClick={() => handleDeleteReminder(r.id)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#64748b' }} title={t('common.delete')}>✕</button>
                            </div>
                          </div>
                          <div style={{ color: '#334155', lineHeight: '1.5' }}>{r.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>{t('teacher.noReminders')}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Justification Modal */}
      {activeJustify && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3>{t('absences.justify')}</h3>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>{t('absences.justificationText')}</label>
              <textarea 
                value={justificationText} 
                onChange={(e) => setJustificationText(e.target.value)}
                placeholder={t('absences.enterJustification')}
                style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveJustify(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={() => handleJustify(activeJustify)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>{t('common.submit')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Catch-up Modal */}
      {activeCatchup && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3>{t('absences.catchUp')}</h3>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>{t('absences.selectDate')}</label>
              <input type="date" value={catchupData.date} onChange={(e) => setCatchupData({...catchupData, date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div className="form-group">
                <label>{t('absences.startTime')}</label>
                <input type="time" value={catchupData.startTime} onChange={(e) => setCatchupData({...catchupData, startTime: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} />
              </div>
              <div className="form-group">
                <label>{t('absences.endTime')}</label>
                <input type="time" value={catchupData.endTime} onChange={(e) => setCatchupData({...catchupData, endTime: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveCatchup(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={() => handleCatchup(activeCatchup)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>{t('common.submit')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardTeacher;
