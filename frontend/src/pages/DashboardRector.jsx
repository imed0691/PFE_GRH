import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

import ManageDepartments from './ManageDepartments';
import ManageReminders from './ManageReminders';
import ManagePromotions from './ManagePromotions';
import ManageEvaluations from './ManageEvaluations';
import ReminderInbox from './ReminderInbox';
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
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.communications')} <NotifBadge count={badges.reminders} /></button>
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
                <div className="stat-card" onClick={() => { setView('directory'); setFilter('all'); }} style={{ cursor: 'pointer' }}>
                  <h3>{t('rector.totalStaff')}</h3><p className="stat-value">{users.length}</p>
                </div>
                <div className="stat-card" onClick={() => { setView('directory'); setFilter('TEACHER'); }} style={{ cursor: 'pointer' }}>
                  <h3>{t('rector.teachers')}</h3><p className="stat-value">{teachersCount}</p>
                </div>
                <div className="stat-card" onClick={() => { setView('directory'); setFilter('management'); }} style={{ cursor: 'pointer' }}>
                  <h3>{t('rector.deansViceDeans')}</h3><p className="stat-value">{deansCount}</p>
                </div>
                <div className="stat-card" onClick={() => setView('departments')} style={{ cursor: 'pointer' }}>
                  <h3>{t('rector.departments')}</h3><p className="stat-value">{departments.length}</p>
                </div>
              </div>
            )
          ) : view === 'directory' ? (
            <div style={{ padding: '0 2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <button 
                  onClick={() => { setView('overview'); setFilter('all'); }} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'white', 
                    border: '1px solid #e2e8f0', 
                    color: '#64748b', 
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer', 
                    fontWeight: '500',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                >
                  ← {t('common.back') || 'Back'}
                </button>
                
                {(filter === 'TEACHER' || filter.startsWith('dept_')) && (
                  <select
                    value={filter.startsWith('dept_') ? filter : ''}
                    onChange={(e) => setFilter(e.target.value || 'TEACHER')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#64748b',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '180px'
                    }}
                  >
                    <option value="">{t('sidebar.departments')} (Tous)</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={`dept_${dept.id}`}>{dept.name}</option>
                    ))}
                  </select>
                )}

                <div className="search-box" style={{ margin: 0, flex: 1 }}>
                  <input 
                    type="text" 
                    placeholder={t('common.search') || 'Search staff...'} 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="table-card">
                {loading ? <div className="loading-spinner">{t('rector.loadingDirectory')}</div> : (
                  <table className="modern-table">
                    <thead><tr><th>#</th><th>{t('common.fullName')}</th><th>{t('common.email')}</th><th>{t('common.department')}</th><th>{t('common.role')}</th></tr></thead>
                    <tbody>
                      {users
                        .filter(u => {
                          const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                          const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                          if (!matchesSearch) return false;

                          if (filter === 'all') return true;
                          if (filter === 'TEACHER') return u.role === 'TEACHER' || u.role === 'ENSEIGNANT';
                          if (filter === 'management') return ['DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN'].includes(u.role);
                          if (filter.startsWith('dept_')) {
                            const deptId = parseInt(filter.split('_')[1]);
                            return (u.role === 'TEACHER' || u.role === 'ENSEIGNANT') && u.department_id === deptId;
                          }
                          return true;
                        })
                        .map((u, index) => (
                          <tr key={u.id}>
                            <td>{index + 1}</td>
                            <td><strong>{u.nom}</strong> {u.prenom}</td>
                            <td>{u.email}</td>
                            <td>{u.department_name || '-'}</td>
                            <td><span className={`role-tag role-${u.role.toLowerCase()}`}>{t('roles.' + u.role) || u.role}</span></td>
                          </tr>
                        ))}
                      {users.length === 0 && <tr><td colSpan="5" className="empty-state">{t('rector.noStaffFound')}</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : view === 'departments' ? (
            <>
              <button 
                onClick={() => setView('overview')} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  color: '#64748b', 
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer', 
                  marginBottom: '20px',
                  fontWeight: '500',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
              >
                ← {t('common.back') || 'Back to Overview'}
              </button>
              <ManageDepartments />
            </>
          ) : view === 'promotions' ? <ManagePromotions user={user} /> : view === 'evaluations' ? <ManageEvaluations user={user} /> : view === 'reminders' ? (
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

export default DashboardRector;
