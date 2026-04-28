import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';
import './DashboardViceRector.css';

function DashboardViceRector({ user, onLogout }) {
  const [sessionsCount, setSessionsCount] = useState(0);
  const [unreadAbsences, setUnreadAbsences] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
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

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resUsers, resSessions, resAbsences] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/absences', { headers })
      ]);
      if (resUsers.ok) { setTeachersCount((await resUsers.json()).filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length); }
      if (resSessions.ok) { setSessionsCount((await resSessions.json()).length); }
      if (resAbsences.ok) { setUnreadAbsences((await resAbsences.json()).filter(a => !a.is_read_by_admin).length); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const markAbsencesAsRead = async () => {
    if (unreadAbsences === 0) return;
    try { const token = localStorage.getItem('token'); await fetch('http://localhost:5000/api/absences/read-admin', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }); setUnreadAbsences(0); } catch (e) { console.error(e); }
  };

  useEffect(() => { if (view === 'overview') fetchOverviewData(); if (view === 'absences') markAbsencesAsRead(); }, [view]);

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
          <button className={`nav-item ${view === 'sessions' ? 'active' : ''}`} onClick={() => setView('sessions')}>{t('sidebar.academicAffairs')}</button>
          <button className={`nav-item ${view === 'absences' ? 'active' : ''}`} onClick={() => setView('absences')}>{t('sidebar.absences')} <NotifBadge count={unreadAbsences || badges.absences} /></button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.communications')}</button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'overview' ? t('topbar.universityPedagogy') : view === 'sessions' ? t('topbar.globalAcademicAffairs') : view === 'absences' ? t('topbar.globalAbsences') : view === 'settings' ? t('settings.title') : t('topbar.officialCommunications')}</h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div className="content-area">
          {view === 'overview' ? (loading ? <div className="loading-spinner">{t('common.loading')}</div> : (
            <div className="overview-grid">
              <div className="stat-card"><h3>{t('viceRector.totalTeachersUni')}</h3><p className="stat-value">{teachersCount}</p></div>
              <div className="stat-card"><h3>{t('viceRector.activeSessionsUni')}</h3><p className="stat-value">{sessionsCount}</p></div>
              <div className="stat-card" style={{ borderBottomColor: unreadAbsences > 0 ? '#ef4444' : 'var(--vicerec-primary)' }}><h3>{t('viceRector.newAbsences')}</h3><p className="stat-value" style={{ color: unreadAbsences > 0 ? '#ef4444' : 'var(--text-main)' }}>{unreadAbsences}</p></div>
            </div>
          )) : view === 'sessions' ? <ManageSessions /> : view === 'absences' ? <ManageAbsences /> : view === 'reminders' ? <ManageReminders /> : view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : null}
        </div>
      </main>
    </div>
  );
}

export default DashboardViceRector;
