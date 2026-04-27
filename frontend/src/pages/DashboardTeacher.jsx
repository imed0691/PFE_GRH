import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './DashboardTeacher.css';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageResearch from './ManageResearch';
import ManageEvaluations from './ManageEvaluations';
import NotificationFeed from './NotificationFeed';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';

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
      // Update local state
      setData(prev => ({
        ...prev,
        reminders: prev.reminders.map(r => ({ ...r, is_read: true }))
      }));
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
      // Update local state
      setData(prev => ({
        ...prev,
        my_absences: prev.my_absences.map(a => ({ ...a, is_read_by_teacher: true }))
      }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (view === 'reminders') {
      markRemindersAsRead();
    }
    if (view === 'absences') {
      markAbsencesAsRead();
    }
  }, [view, data.reminders, data.my_absences]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/teacher/dashboard/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  // 🔔 Afficher une notification à l'entrée si il y a des messages non lus
  useEffect(() => {
    if (loading) return; // Attendre que les données soient chargées
    
    const unreadR = data.reminders ? data.reminders.filter(r => !r.is_read).length : 0;
    const unreadA = data.my_absences ? data.my_absences.filter(a => !a.is_read_by_teacher).length : 0;
    const total = unreadR + unreadA;

    if (total > 0) {
      toast(
        () => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔔</span>
            <div>
              <strong>Vous avez {total} notification{total > 1 ? 's' : ''} non lue{total > 1 ? 's' : ''}</strong>
              {unreadR > 0 && <div style={{ fontSize: '12px', color: '#64748b' }}>📢 {unreadR} message{unreadR > 1 ? 's' : ''} de l'administration</div>}
              {unreadA > 0 && <div style={{ fontSize: '12px', color: '#64748b' }}>🏖️ {unreadA} mise{unreadA > 1 ? 's' : ''} à jour d'absence</div>}
            </div>
          </div>
        ),
        {
          duration: 5000,
          style: {
            background: '#eff6ff',
            border: '1px solid #3b82f6',
            color: '#1e3a8a',
            borderRadius: '12px',
            padding: '14px 18px',
          },
          icon: null,
        }
      );
    }
  }, [loading]); // Se déclenche une seule fois quand loading passe à false

  const handleReportAbsence = async (e) => {
    e.preventDefault();
    if (!absenceDate || !absenceReason) return toast.error("All fields are required");

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teacher_id: user.id,
          date: absenceDate,
          reason: absenceReason
        })
      });

      if (res.ok) {
        toast.success("Absence request sent to HR");
        setAbsenceReason('');
        setAbsenceDate('');
        fetchDashboardData(); // Refresh to update absence history
      } else {
        toast.error("Error sending request");
      }
    } catch (error) {
      toast.error("Server error");
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reminders/${id}/hide`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          reminders: prev.reminders.filter(r => r.id !== id)
        }));
        toast.success("Reminder deleted");
      }
    } catch (error) {
      toast.error("Error deleting reminder");
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
        toast.success("All reminders cleared");
      }
    } catch (error) {
      toast.error("Error clearing reminders");
    }
  };

  const volumeRestant = data.stats.volume_horaire - data.stats.heures_assurees;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🎓</div>
          <h2>PFE_GRH</h2>
        </div>
        
        <div className="user-profile">
          <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role">Teacher</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}>📅 My Schedule</button>
          <button className={`nav-item ${view === 'absences' ? 'active' : ''}`} onClick={() => setView('absences')}>🏖️ Absences <NotifBadge count={unreadAbsencesCount || badges.absences} /></button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>🔔 Reminders <NotifBadge count={unreadRemindersCount} /></button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => setView('promotions')}>📈 Promotions <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => setView('documents')}>📄 Documents <NotifBadge count={badges.documents} /></button>
          <button className={`nav-item ${view === 'research' ? 'active' : ''}`} onClick={() => setView('research')}>🔬 Research <NotifBadge count={badges.research} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => setView('evaluations')}>⭐ Evaluations <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'feed' ? 'active' : ''}`} onClick={() => setView('feed')}>📰 Activity Feed</button>
        </nav>

        <button className="btn-logout" onClick={onLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h1>
            {view === 'schedule' ? 'My Schedule' : 
             view === 'absences' ? 'Absences Management' : 
             view === 'promotions' ? 'Career Advancements' :
             view === 'documents' ? 'Administrative Documents' :
             view === 'research' ? 'Research Activities' :
             view === 'evaluations' ? 'My Evaluations' :
             'Reminders & Communications'}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {loading ? (
            <div className="loading-spinner">Loading your dashboard...</div>
          ) : (
            <>
              {view === 'schedule' && (
                <>
                  {/* Widgets */}
                  <div className="dashboard-widgets">
                    <div className="widget">
                      <div className="widget-icon">⏱️</div>
                      <div className="widget-info">
                        <h4>Remaining Hours</h4>
                        <p>{volumeRestant}h <span style={{fontSize: '1rem', color: '#64748b', fontWeight: 'normal'}}>/ {data.stats.volume_horaire}h</span></p>
                      </div>
                    </div>
                    
                    <div className="widget">
                      <div className="widget-icon">✅</div>
                      <div className="widget-info">
                        <h4>Completed Hours</h4>
                        <p>{data.stats.heures_assurees}h</p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Table */}
                  <div className="table-card">
                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Weekly Schedule</h3>
                    {data.all_sessions && data.all_sessions.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="modern-table">
                          <thead>
                            <tr>
                              <th>Day</th>
                              <th>Time</th>
                              <th>Module</th>
                              <th>Level</th>
                              <th>Type</th>
                              <th>Section/Group</th>
                              <th>Department</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.all_sessions.map(s => (
                              <tr key={s.id}>
                                <td><strong>{s.day_of_week}</strong></td>
                                <td>{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</td>
                                <td>{s.module_name}</td>
                                <td><span className="role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{s.study_level}</span></td>
                                <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{s.session_type === 'Lecture' ? 'Lecture' : s.session_type === 'Tutorial' ? 'Tutorial (TD)' : 'Practical (TP)'}</span></td>
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
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🏖️</span>
                        No sessions scheduled. Enjoy your free time!
                      </div>
                    )}
                  </div>
                </>
              )}

              {view === 'absences' && (
                <>
                  <div className="dashboard-widgets">
                    <div className="widget" style={{ borderLeft: '4px solid #ef4444' }}>
                      <div className="widget-icon">⚠️</div>
                      <div className="widget-info">
                        <h4>Total Approved Absences</h4>
                        <p style={{ color: data.stats.absences > 0 ? '#ef4444' : '#10b981' }}>
                          {data.stats.absences}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="table-card" style={{ maxWidth: '600px', margin: '0 auto 30px auto' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Report an Absence</h3>
                    <form onSubmit={handleReportAbsence} className="add-form">
                      <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Reason / Justification</label>
                        <textarea value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} required rows="3"></textarea>
                      </div>
                      <button type="submit" style={{ width: '100%' }}>Submit Request</button>
                    </form>
                  </div>

                  <div className="table-card">
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>My Absence History</h3>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.my_absences && data.my_absences.map(a => (
                          <tr key={a.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {!a.is_read_by_teacher && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>}
                                {new Date(a.date).toLocaleDateString('en-US')}
                              </div>
                            </td>
                            <td style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                              {expandedReasons[a.id] || a.reason.length <= 50 
                                ? a.reason 
                                : `${a.reason.substring(0, 50)}... `}
                              {a.reason.length > 50 && (
                                <button 
                                  onClick={() => toggleReason(a.id)}
                                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline', padding: 0, marginLeft: '5px' }}
                                >
                                  {expandedReasons[a.id] ? 'Voir moins' : 'Voir plus'}
                                </button>
                              )}
                            </td>
                            <td>
                              <span className="role-tag" style={{
                                background: a.status === 'Approved' ? '#d1fae5' : a.status === 'Rejected' ? '#fee2e2' : a.status === 'Recommended' ? '#dbeafe' : '#fef3c7',
                                color: a.status === 'Approved' ? '#065f46' : a.status === 'Rejected' ? '#991b1b' : a.status === 'Recommended' ? '#1e40af' : '#92400e'
                              }}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!data.my_absences || data.my_absences.length === 0) && (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No absence records found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {view === 'promotions' && (
                <ManagePromotions user={user} />
              )}

              {view === 'documents' && (
                <ManageDocuments user={user} />
              )}

              {view === 'research' && (
                <ManageResearch user={user} />
              )}

              {view === 'evaluations' && (
                <ManageEvaluations user={user} />
              )}

              {view === 'feed' && (
                <NotificationFeed />
              )}

              {view === 'reminders' && (
                <div className="table-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Communications from HR & Dept</h3>
                    {data.reminders && data.reminders.length > 0 && (
                      <button 
                        onClick={handleClearAllReminders}
                        style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️ Clear All
                      </button>
                    )}
                  </div>
                  {data.reminders && data.reminders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {data.reminders.map(r => (
                        <div key={r.id} style={{
                          padding: '15px 20px', 
                          borderRadius: '8px',
                          borderLeft: `4px solid ${r.type === 'error' ? '#ef4444' : r.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
                          background: r.type === 'error' ? '#fef2f2' : r.type === 'warning' ? '#fffbeb' : '#eff6ff'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: r.type === 'error' ? '#991b1b' : r.type === 'warning' ? '#92400e' : '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              {!r.is_read && <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>}
                              <span>{r.type === 'error' ? 'Urgent' : r.type === 'warning' ? 'Important' : 'Information'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              {r.sender_nom && (
                                <span style={{ fontSize: '0.85em', fontWeight: 'normal', color: '#64748b' }}>
                                  From: {r.sender_prenom} {r.sender_nom} ({r.sender_role})
                                </span>
                              )}
                              <button 
                                onClick={() => handleDeleteReminder(r.id)}
                                style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: '#64748b' }}
                                title="Delete"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div style={{ color: '#334155', lineHeight: '1.5' }}>{r.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      No new reminders or communications.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardTeacher;
