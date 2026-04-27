import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import NotificationFeed from './NotificationFeed';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import './DashboardViceDean.css';

function DashboardViceDean({ user, onLogout }) {
  const [sessionsCount, setSessionsCount] = useState(0);
  const [unreadAbsences, setUnreadAbsences] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);

  const [view, setViewRaw] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();

  const setView = (newView) => {
    setViewRaw(newView);
    if (badges[newView] && badges[newView] > 0) {
      markSeen(newView);
    }
  };

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
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
            {user.prenom[0]}{user.nom[0]}
          </div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role" style={{ background: 'rgba(20, 184, 166, 0.2)', color: '#5eead4' }}>
              Vice Dean
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}>📊 Overview</button>
          <button className={`nav-item ${view === 'sessions' ? 'active' : ''}`} onClick={() => setView('sessions')}>📚 Academic Affairs</button>
          <button className={`nav-item ${view === 'absences' ? 'active' : ''}`} onClick={() => setView('absences')}>🏖️ Absences <NotifBadge count={unreadAbsences || badges.absences} /></button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>📢 Communications</button>
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
            {view === 'overview' ? 'Pedagogy Dashboard' :
              view === 'sessions' ? 'Schedules & Sessions' :
                view === 'absences' ? 'Teacher Absences' :
                  'Communications & Reminders'}
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
                  <h3>Total Teachers</h3>
                  <p className="stat-value">{teachersCount}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Sessions</h3>
                  <p className="stat-value">{sessionsCount}</p>
                </div>
                <div className="stat-card" style={{ borderBottomColor: unreadAbsences > 0 ? '#ef4444' : 'var(--vice-primary)' }}>
                  <h3>New Absences</h3>
                  <p className="stat-value" style={{ color: unreadAbsences > 0 ? '#ef4444' : 'var(--text-main)' }}>{unreadAbsences}</p>
                </div>
              </div>
            )
          ) : view === 'sessions' ? (
            <ManageSessions />
          ) : view === 'absences' ? (
            <ManageAbsences />
          ) : view === 'feed' ? (
            <NotificationFeed />
          ) : view === 'reminders' ? (
            <ManageReminders />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default DashboardViceDean;
