import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';
import './DashboardViceDean.css';

function DashboardViceDean({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setViewRaw] = useState('staff');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();
  const { t, locale } = useLanguage();

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => { setViewRaw(newView); if (badges[newView] && badges[newView] > 0) markSeen(newView); };



  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (error) { toast.error(t('dean.errorFetchUsers')); } finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/departments', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setDepartments(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => { 
    if (view === 'staff') {
      fetchUsers();
      fetchDepartments();
    }
  }, [view]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="sidebar-header"><h2>PFE_GRH</h2></div>
        <div className="user-profile">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info"><h4>{user.prenom} {user.nom}</h4><span className="badge-role" style={{ background: 'rgba(20, 184, 166, 0.2)', color: '#5eead4' }}>{t('roles.VICE_DEAN')}</span></div>
        </div>
        <nav className="sidebar-nav">

          <button className={`nav-item ${view === 'staff' ? 'active' : ''}`} onClick={() => setView('staff')}>{t('sidebar.humanResources')}</button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.communications')} <NotifBadge count={badges.reminders} /></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'staff' ? t('topbar.facultyStaff') : view === 'reminders' ? t('topbar.communicationsReminders') : t('settings.title')}</h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div className="content-area">
          {view === 'staff' ? (
            <>
              <div className="list-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <div className="filter-nav" style={{ marginBottom: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('common.all')}</button>
                  <button className={`filter-btn ${filter === 'management' ? 'active' : ''}`} onClick={() => setFilter('management')}>{t('roles.VICE_DEAN')}</button>
                  <button className={`filter-btn ${filter === 'DEPARTMENT_HEAD' ? 'active' : ''}`} onClick={() => setFilter('DEPARTMENT_HEAD')}>{t('roles.DEPARTMENT_HEAD')}</button>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      className="dept-filter-select"
                      value={filter.startsWith('dept_') ? filter : ''}
                      onChange={(e) => setFilter(e.target.value)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                        background: filter.startsWith('dept_') ? 'var(--primary)' : 'white',
                        color: filter.startsWith('dept_') ? 'white' : 'var(--text-muted)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <option value="" hidden>{t('sidebar.departments')}</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={`dept_${dept.id}`}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder={t('common.search') || 'Search...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="table-card">
                {loading ? <div className="loading-spinner">{t('common.loading')}</div> : (
                  <table className="modern-table">
                    <thead><tr><th>#</th><th>{t('common.id')}</th><th>{t('common.fullName')}</th><th>{t('common.email')}</th><th>{t('common.department')}</th><th>{t('common.role')}</th></tr></thead>
                    <tbody>
                      {users
                        .filter(u => {
                          const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                          const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                          if (!matchesSearch) return false;

                          if (filter === 'all') return true;
                          if (filter === 'management') return u.role === 'VICE_DEAN' || u.role === 'VICE_DOYEN';
                          if (filter === 'DEPARTMENT_HEAD') return u.role === 'DEPARTMENT_HEAD' || u.role === 'CHEF_DEPARTEMENT';
                          if (filter.startsWith('dept_')) {
                            const deptId = parseInt(filter.split('_')[1]);
                            return u.department_id === deptId;
                          }
                          return true;
                        })
                        .map((u, index) => (
                          <tr key={u.id}>
                            <td>{index + 1}</td>
                            <td>#{u.id}</td>
                            <td><strong>{u.nom}</strong> {u.prenom}</td>
                            <td>{u.email}</td>
                            <td>{u.department_name || '-'}</td>
                            <td><span className={`role-tag role-${u.role.toLowerCase()}`}>{t('roles.' + u.role) || u.role}</span></td>
                          </tr>
                        ))}
                      {users.length === 0 && <tr><td colSpan="6" className="empty-state">{t('dean.noEmployeesFound')}</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : view === 'reminders' ? (
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

export default DashboardViceDean;
