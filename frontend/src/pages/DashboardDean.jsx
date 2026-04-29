import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';
import './DashboardDean.css';

function DashboardDean({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [view, setView] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();
  const { t, locale } = useLanguage();

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const handleViewChange = (newView) => { setView(newView); if (badges[newView] && badges[newView] > 0) markSeen(newView); };

  const fetchUsers = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } }); const data = await res.json(); if (res.ok) setUsers(data); } catch (error) { toast.error(t('dean.errorFetchStaff')); } finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/departments', { headers: { 'Authorization': `Bearer ${token}` } }); const data = await res.json(); if (res.ok) setDepartments(data); } catch (error) { console.error(error); }
  };

  useEffect(() => { 
    if (view === 'staff' || view === 'overview') {
      fetchUsers();
      fetchDepartments();
    }
  }, [view]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h2>PFE_GRH</h2></div>
        <div className="user-profile">
          <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info"><h4>{user.prenom} {user.nom}</h4><span className="badge-role" style={{ background: 'rgba(254, 243, 199, 0.2)', color: '#fef3c7' }}>{t('roles.DEAN')}</span></div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => handleViewChange('overview')}>{t('sidebar.overview')}</button>
          <button className={`nav-item ${view === 'staff' ? 'active' : ''}`} onClick={() => handleViewChange('staff')}>{t('sidebar.humanResources')}</button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => handleViewChange('reminders')}>{t('sidebar.communications')} <NotifBadge count={badges.reminders} /></button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => handleViewChange('promotions')}>{t('sidebar.promotions')} <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => handleViewChange('documents')}>{t('sidebar.documents')} <NotifBadge count={badges.documents} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => handleViewChange('evaluations')}>{t('sidebar.evaluations')} <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => handleViewChange('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'overview' ? t('topbar.facultyDashboard') : view === 'departments' ? t('topbar.manageDepartments') : view === 'sessions' ? t('topbar.schedulesAndSessions') : view === 'staff' ? t('topbar.facultyStaff') : view === 'promotions' ? t('topbar.careerAdvancements') : view === 'documents' ? t('topbar.documentRequests') : view === 'evaluations' ? t('topbar.teacherEvaluations') : view === 'settings' ? t('settings.title') : t('topbar.communicationsReminders')}</h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div className="content-area">
          {view === 'overview' ? (
            <div className="overview-grid">
              <div className="stat-card"><h3>{t('dean.totalDepartments')}</h3><p className="stat-value">{departments.length || 0}</p></div>
              <div className="stat-card"><h3>{t('dean.totalStaff')}</h3><p className="stat-value">{users.length || 0}</p></div>
              <div className="stat-card"><h3>{t('dean.teachers')}</h3><p className="stat-value">{users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length || 0}</p></div>
            </div>
          ) : view === 'promotions' ? (
            <ManagePromotions user={user} />
          ) : view === 'documents' ? (
            <ManageDocuments user={user} />
          ) : view === 'evaluations' ? (
            <ManageEvaluations user={user} />
          ) : view === 'reminders' ? (
            <>
              <ManageReminders user={user} />
              <ReminderInbox user={user} />
            </>
          ) : view === 'settings' ? (
            <Settings user={user} onProfileUpdate={handleProfileUpdate} />
          ) : (
            <>
              <div className="list-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <div className="filter-nav" style={{ marginBottom: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('common.all')}</button>
                  <button className={`filter-btn ${filter === 'management' ? 'active' : ''}`} onClick={() => setFilter('management')}>Management</button>
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
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardDean;
