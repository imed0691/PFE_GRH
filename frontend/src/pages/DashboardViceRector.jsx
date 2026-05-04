import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import './DashboardViceRector.css';

function DashboardViceRector({ user, onLogout }) {
  const [sessionsCount, setSessionsCount] = useState(0);
  const [unreadAbsences, setUnreadAbsences] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  
  const [view, setView] = useState('overview'); // 'overview', 'sessions', 'absences', 'reminders'
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch users, sessions, and absences for the overview
      const [resUsers, resSessions, resAbsences] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/absences', { headers })
      ]);

      if (resUsers.ok) {
        const users = await resUsers.json();
        setTeachersCount(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length);
      }
      if (resSessions.ok) {
        const sessions = await resSessions.json();
        setSessionsCount(sessions.length);
      }
      if (resAbsences.ok) {
        const absences = await resAbsences.json();
        const unreadCount = absences.filter(a => !a.is_read_by_admin).length;
        setUnreadAbsences(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching overview data", error);
    } finally {
      setLoading(false);
    }
  };

  const markAbsencesAsRead = async () => {
    if (unreadAbsences === 0) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/absences/read-admin', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnreadAbsences(0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (view === 'overview') {
      fetchOverviewData();
    }
    if (view === 'absences') {
      markAbsencesAsRead();
    }
  }, [view]);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="sidebar-header">
          <div className="logo-icon">🎓</div>
          <h2>PFE_GRH</h2>
        </div>
        
        <div className="user-profile">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
            {user.prenom[0]}{user.nom[0]}
          </div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0' }}>
              Vice Rector / Vice-Recteur
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            📊 Pedagogy Overview
          </button>
          <button 
            className={`nav-item ${view === 'sessions' ? 'active' : ''}`}
            onClick={() => setView('sessions')}
          >
            📚 Global Academic Affairs
          </button>
          <button 
            className={`nav-item ${view === 'absences' ? 'active' : ''}`}
            onClick={() => setView('absences')}
          >
            🏖️ Global Absences
            {unreadAbsences > 0 && (
               <span style={{background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: 'auto'}}>
                 {unreadAbsences}
               </span>
            )}
          </button>
          <button 
            className={`nav-item ${view === 'reminders' ? 'active' : ''}`}
            onClick={() => setView('reminders')}
          >
            📢 Official Communications
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
            {view === 'overview' ? 'University Pedagogy Overview' : 
             view === 'sessions' ? 'Global Academic Affairs' :
             view === 'absences' ? 'Global Absences Management' :
             'Official Communications'}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {view === 'overview' ? (
            loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : (
              <div className="overview-grid">
                <div className="stat-card">
                  <h3>Total Teachers (University)</h3>
                  <p className="stat-value">{teachersCount}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Sessions (University)</h3>
                  <p className="stat-value">{sessionsCount}</p>
                </div>
                <div className="stat-card" style={{ borderBottomColor: unreadAbsences > 0 ? '#ef4444' : 'var(--vicerec-primary)' }}>
                  <h3>New Absences</h3>
                  <p className="stat-value" style={{ color: unreadAbsences > 0 ? '#ef4444' : 'var(--text-main)' }}>{unreadAbsences}</p>
                </div>
              </div>
            )
          ) : view === 'sessions' ? (
            <ManageSessions />
          ) : view === 'absences' ? (
            <ManageAbsences />
          ) : view === 'reminders' ? (
            <ManageReminders />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default DashboardViceRector;
