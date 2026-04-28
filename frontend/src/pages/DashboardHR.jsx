import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AddEmployee from './AddEmployee';
import ManageDepartments from './ManageDepartments';
import ManageSalaries from './ManageSalaries';
import ManageReminders from './ManageReminders';
import ManageDocuments from './ManageDocuments';
import ManagePromotions from './ManagePromotions';
import Settings from './Settings';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import './DashboardHR.css';

function DashboardHR({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setViewRaw] = useState('list');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();
  const { t, locale } = useLanguage();

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => {
    setViewRaw(newView);
    if (badges[newView] && badges[newView] > 0) {
      markSeen(newView);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (error) {
      toast.error(t('hr.errorFetchEmployees'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUnreadAbsences = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const absences = await res.json();
        const unreadCount = absences.filter(a => !a.is_read_by_admin).length;
        setUnreadAbsences(unreadCount);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAbsencesAsRead = async () => {
    return;
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchUsers();
    }
  }, [view]);

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`${t('hr.confirmDelete')} ${nom}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(t('hr.userDeleted'));
        fetchUsers();
      } else {
        toast.error(t('hr.errorDeleting'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>PFE_GRH</h2>
        </div>

        <div className="user-profile">
          <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role">{t('roles.RH_MANAGER')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>{t('sidebar.staffList')}</button>
          <button className={`nav-item ${view === 'add' ? 'active' : ''}`} onClick={() => setView('add')}>{t('sidebar.addEmployee')}</button>
          <button className={`nav-item ${view === 'departments' ? 'active' : ''}`} onClick={() => setView('departments')}>{t('sidebar.departments')}</button>
          <button className={`nav-item ${view === 'salaries' ? 'active' : ''}`} onClick={() => setView('salaries')}>{t('sidebar.salaries')}</button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.reminders')}</button>
          <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => setView('documents')}>{t('sidebar.documents')} <NotifBadge count={badges.documents} /></button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => setView('promotions')}>{t('sidebar.promotions')} <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>

        <button className="btn-logout" onClick={onLogout}>
          {t('common.logout')}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h1>
            {view === 'list' ? t('topbar.personnelManagement') :
              view === 'add' ? t('topbar.newHire') :
                view === 'departments' ? t('topbar.manageDepartments') :
                  view === 'salaries' ? t('topbar.salaryCalculation') :
                    view === 'documents' ? t('topbar.documentRequests') :
                      view === 'promotions' ? t('topbar.careerAdvancements') :
                        view === 'settings' ? t('settings.title') :
                          t('topbar.sendReminders')}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {view === 'add' ? (
            <AddEmployee
              onCancel={() => setView('list')}
              onSuccess={() => setView('list')}
            />
          ) : view === 'departments' ? (
            <ManageDepartments />
          ) : view === 'salaries' ? (
            <ManageSalaries />
          ) : view === 'documents' ? (
            <ManageDocuments user={user} />
          ) : view === 'promotions' ? (
            <ManagePromotions user={user} />
          ) : view === 'reminders' ? (
            <ManageReminders />
          ) : view === 'settings' ? (
            <Settings user={user} onProfileUpdate={handleProfileUpdate} />
          ) : (
            <>
              <div className="list-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <div className="filter-nav" style={{ marginBottom: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('common.all')}</button>
                  <button className={`filter-btn ${filter === 'direction' ? 'active' : ''}`} onClick={() => setFilter('direction')}>{t('hr.direction') || 'Direction'}</button>
                  <button className={`filter-btn ${filter === 'DEPARTMENT_HEAD' ? 'active' : ''}`} onClick={() => setFilter('DEPARTMENT_HEAD')}>{t('roles.DEPARTMENT_HEAD')}</button>

                  <div style={{ height: '24px', width: '1px', background: '#e2e8f0', margin: '0 5px' }}></div>

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
                {loading ? (
                  <div className="loading-spinner">{t('common.loadingData')}</div>
                ) : (
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('common.id')}</th>
                        <th>{t('common.fullName')}</th>
                        <th>{t('common.email')}</th>
                        <th>{t('common.department')}</th>
                        <th>{t('common.role')}</th>
                        <th>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => {
                          // Search filter
                          const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                          const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                          if (!matchesSearch) return false;

                          // Category filter
                          if (filter === 'all') return true;
                          if (filter === 'direction') return ['DEAN', 'VICE_DEAN', 'RECTOR', 'VICE_RECTOR'].includes(u.role);
                          if (filter === 'DEPARTMENT_HEAD') return u.role === 'DEPARTMENT_HEAD';
                          if (filter.startsWith('dept_')) {
                            const deptId = parseInt(filter.split('_')[1]);
                            return u.department_id === deptId && (u.role === 'TEACHER' || u.role === 'ENSEIGNANT');
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
                            <td>
                              {u.role !== 'RH_MANAGER' && (
                                <button className="btn-delete" onClick={() => handleDelete(u.id, u.nom)}>
                                  {t('common.delete')}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      {users.length === 0 && (
                        <tr><td colSpan="7" className="empty-state">{t('hr.noEmployeesFound')}</td></tr>
                      )}
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

export default DashboardHR;
