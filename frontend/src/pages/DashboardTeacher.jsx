import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './DashboardTeacher.css';

function DashboardTeacher({ user, onLogout }) {
  const [data, setData] = useState({
    all_sessions: [],
    stats: { volume_horaire: 0, heures_assurees: 0, absences: 0 },
    reminders: [],
    my_absences: []
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('schedule'); // 'schedule', 'absences', 'reminders'
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceDate, setAbsenceDate] = useState('');

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
          <button 
            className={`nav-item ${view === 'schedule' ? 'active' : ''}`}
            onClick={() => setView('schedule')}
          >
            📅 My Schedule
          </button>
          <button 
            className={`nav-item ${view === 'absences' ? 'active' : ''}`}
            onClick={() => setView('absences')}
          >
            🏖️ Absences
          </button>
          <button 
            className={`nav-item ${view === 'reminders' ? 'active' : ''}`}
            onClick={() => setView('reminders')}
          >
            🔔 Reminders
            {data.reminders && data.reminders.length > 0 && (
               <span style={{background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: 'auto'}}>
                 {data.reminders.length}
               </span>
            )}
          </button>
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
                            <td>{new Date(a.date).toLocaleDateString('en-US')}</td>
                            <td>{a.reason}</td>
                            <td>
                              <span className="role-tag" style={{
                                background: a.status === 'Approved' ? '#d1fae5' : a.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                color: a.status === 'Approved' ? '#065f46' : a.status === 'Rejected' ? '#991b1b' : '#92400e'
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

              {view === 'reminders' && (
                <div className="table-card">
                  <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Communications from HR</h3>
                  {data.reminders && data.reminders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {data.reminders.map(r => (
                        <div key={r.id} style={{
                          padding: '15px 20px', 
                          borderRadius: '8px',
                          borderLeft: `4px solid ${r.type === 'error' ? '#ef4444' : r.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
                          background: r.type === 'error' ? '#fef2f2' : r.type === 'warning' ? '#fffbeb' : '#eff6ff'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: r.type === 'error' ? '#991b1b' : r.type === 'warning' ? '#92400e' : '#1e40af' }}>
                            {r.type === 'error' ? 'Urgent' : r.type === 'warning' ? 'Important' : 'Information'}
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
