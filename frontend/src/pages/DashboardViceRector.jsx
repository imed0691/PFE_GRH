import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

import ManageEvaluations from './ManageEvaluations';
import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';
import './DashboardViceRector.css';

function DashboardViceRector({ user, onLogout }) {
  const [sessionsCount, setSessionsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [deansCount, setDeansCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [view, setViewRaw] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();
  const { t, locale } = useLanguage();

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => { setViewRaw(newView); if (badges[newView] && badges[newView] > 0) markSeen(newView); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resUsers, resSessions, resDepts] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/departments', { headers })
      ]);
      if (resUsers.ok) { 
        const usersData = await resUsers.json(); 
        setUsers(usersData); 
        setTeachersCount(usersData.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length); 
        setDeansCount(usersData.filter(u => ['DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN'].includes(u.role)).length); 
      }
      if (resSessions.ok) { setSessionsCount((await resSessions.json()).length); }
      if (resDepts.ok) { setDepartments(await resDepts.json()); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { if (view === 'overview') fetchData(); }, [view]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="sidebar-header"><h2>PFE_GRH</h2></div>
        <div className="user-profile">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info"><h4>{user.prenom} {user.nom}</h4><span className="badge-role" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0' }}>{t('roles.VICE_RECTOR')}</span></div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}>{t('sidebar.overview')}</button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.communications')} <NotifBadge count={badges.reminders} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => setView('evaluations')}>{t('sidebar.evaluations')} <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'overview' ? t('topbar.universityPedagogy') : view === 'promotions' ? t('topbar.promotionsManagement') : view === 'evaluations' ? t('topbar.evaluationsManagement') : view === 'settings' ? t('settings.title') : t('topbar.officialCommunications')}</h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div className="content-area">
          {view === 'overview' ? (loading ? <div className="loading-spinner">{t('common.loading')}</div> : (
            <div className="overview-grid">
              <div className="stat-card"><h3>{t('rector.totalStaff')}</h3><p className="stat-value">{users.length}</p></div>
              <div className="stat-card"><h3>{t('rector.teachers')}</h3><p className="stat-value">{teachersCount}</p></div>
              <div className="stat-card"><h3>{t('rector.deansViceDeans')}</h3><p className="stat-value">{deansCount}</p></div>
              <div className="stat-card"><h3>{t('rector.departments')}</h3><p className="stat-value">{departments.length}</p></div>
            </div>
          )) : view === 'evaluations' ? <ManageEvaluations user={user} /> : view === 'reminders' ? (
            <>
              <ManageReminders user={user} />
              <ReminderInbox user={user} />
            </>
          ) : view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : null}
        </div>
      </main>
    </div>
  );
}

export default DashboardViceRector;
