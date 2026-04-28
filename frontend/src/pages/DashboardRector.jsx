import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

import ManageDepartments from './ManageDepartments';
import ManageReminders from './ManageReminders';
import ManagePromotions from './ManagePromotions';
import ManageEvaluations from './ManageEvaluations';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';
import './DashboardRector.css';

function DashboardRector({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachersCount, setTeachersCount] = useState(0);
  const [deansCount, setDeansCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
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
      if (resUsers.ok) { const usersData = await resUsers.json(); setUsers(usersData); setTeachersCount(usersData.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length); setDeansCount(usersData.filter(u => ['DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN'].includes(u.role)).length); }
      if (resSessions.ok) { setSessionsCount((await resSessions.json()).length); }
      if (resDepts.ok) { setDepartments(await resDepts.json()); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { if (view === 'overview' || view === 'directory') fetchData(); }, [view]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="sidebar-header"><h2>PFE_GRH</h2></div>
        <div className="user-profile">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info"><h4>{user.prenom} {user.nom}</h4><span className="badge-role" style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#c7d2fe' }}>{t('roles.RECTOR')}</span></div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}>{t('sidebar.overview')}</button>
          <button className={`nav-item ${view === 'directory' ? 'active' : ''}`} onClick={() => setView('directory')}>{t('sidebar.staffDirectory')}</button>
          <button className={`nav-item ${view === 'departments' ? 'active' : ''}`} onClick={() => setView('departments')}>{t('sidebar.facultiesDepts')}</button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.communications')}</button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => setView('promotions')}>{t('sidebar.promotions')} <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => setView('evaluations')}>{t('sidebar.evaluations')} <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'overview' ? t('topbar.universityOverview') : view === 'directory' ? t('topbar.globalStaffDirectory') : view === 'departments' ? t('topbar.universityStructure') : view === 'promotions' ? t('topbar.careerAdvancements') : view === 'evaluations' ? t('topbar.evaluationStatistics') : view === 'settings' ? t('settings.title') : t('topbar.officialCommunications')}</h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div className="content-area">
          {view === 'overview' ? (
            loading ? <div className="loading-spinner">{t('common.loading')}</div> : (
              <div className="overview-grid">
                <div className="stat-card"><h3>{t('rector.totalStaff')}</h3><p className="stat-value">{users.length}</p></div>
                <div className="stat-card"><h3>{t('rector.teachers')}</h3><p className="stat-value">{teachersCount}</p></div>
                <div className="stat-card"><h3>{t('rector.deansViceDeans')}</h3><p className="stat-value">{deansCount}</p></div>
                <div className="stat-card"><h3>{t('rector.departments')}</h3><p className="stat-value">{departments.length}</p></div>
                <div className="stat-card"><h3>{t('rector.activeSessions')}</h3><p className="stat-value">{sessionsCount}</p></div>
              </div>
            )
          ) : view === 'directory' ? (
            <div className="table-card">
              {loading ? <div className="loading-spinner">{t('rector.loadingDirectory')}</div> : (
                <table className="modern-table">
                  <thead><tr><th>{t('common.id')}</th><th>{t('common.fullName')}</th><th>{t('common.email')}</th><th>{t('common.department')}</th><th>{t('common.role')}</th></tr></thead>
                  <tbody>
                    {users.map(u => (<tr key={u.id}><td>#{u.id}</td><td><strong>{u.nom}</strong> {u.prenom}</td><td>{u.email}</td><td>{u.department_name || '-'}</td><td><span className={`role-tag role-${u.role.toLowerCase()}`}>{t('roles.' + u.role) || u.role}</span></td></tr>))}
                    {users.length === 0 && <tr><td colSpan="5" className="empty-state">{t('rector.noStaffFound')}</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          ) : view === 'departments' ? <ManageDepartments /> : view === 'promotions' ? <ManagePromotions user={user} /> : view === 'evaluations' ? <ManageEvaluations user={user} /> : view === 'reminders' ? <ManageReminders /> : view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : null}
        </div>
      </main>
    </div>
  );
}

export default DashboardRector;
