import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AddEmployee from './AddEmployee';
import ManageDepartments from './ManageDepartments';
import ManageClasses from './ManageClasses';
import ManageSalaries from './ManageSalaries';
import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import ManageDocuments from './ManageDocuments';
import ManagePromotions from './ManagePromotions';
import ManageAbsences from './ManageAbsences';
import Settings from './Settings';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import DashboardLayout from '../components/DashboardLayout';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const menuItems = [
    { id: 'list', label: t('sidebar.staffList') },
    { id: 'add', label: t('sidebar.addEmployee') },
    { id: 'departments', label: t('sidebar.departments') },
    { id: 'classes', label: t('sidebar.classes') || 'Classes' },
    { id: 'salaries', label: t('sidebar.salaries') },
    { id: 'absences', label: t('sidebar.absences'), badge: badges.absences },
    { id: 'reminders', label: t('sidebar.reminders'), badge: badges.reminders },
    { id: 'documents', label: t('sidebar.documents'), badge: badges.documents },
    { id: 'promotions', label: t('sidebar.promotions'), badge: badges.promotions },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'list': return t('topbar.personnelManagement');
      case 'add': return t('topbar.newHire');
      case 'departments': return t('topbar.manageDepartments');
      case 'classes': return t('classes.title');
      case 'salaries': return t('topbar.salaryCalculation');
      case 'absences': return t('sidebar.absences');
      case 'documents': return t('topbar.documentRequests');
      case 'promotions': return t('topbar.careerAdvancements');
      case 'settings': return t('settings.title');
      default: return t('topbar.sendReminders');
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={setView}
      menuItems={menuItems}
      onLogout={onLogout}
      title={getPageTitle()}
    >
      <div className="animate-mnadm">
        {view === 'add' ? (
          <AddEmployee onCancel={() => setView('list')} onSuccess={() => setView('list')} />
        ) : view === 'departments' ? (
          <ManageDepartments />
        ) : view === 'classes' ? (
          <ManageClasses />
        ) : view === 'salaries' ? (
          <ManageSalaries />
        ) : view === 'absences' ? (
          <ManageAbsences user={user} />
        ) : view === 'documents' ? (
          <ManageDocuments user={user} />
        ) : view === 'promotions' ? (
          <ManagePromotions user={user} />
        ) : view === 'reminders' ? (
          <ManageReminders user={user} />
        ) : view === 'settings' ? (
          <Settings user={user} onProfileUpdate={handleProfileUpdate} />
        ) : (
          <>
            <div className="list-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', flexWrap: 'wrap', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-md)' }}>
              <div className="filter-nav" style={{ marginBottom: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className={filter === 'all' ? 'btn-confirm-pro' : 'btn-cancel-pro'} onClick={() => setFilter('all')} style={{ padding: '10px 24px', fontSize: '13px' }}>{t('common.all')}</button>
                <button className={filter === 'direction' ? 'btn-confirm-pro' : 'btn-cancel-pro'} onClick={() => setFilter('direction')} style={{ padding: '10px 24px', fontSize: '13px' }}>{t('hr.direction') || 'Direction'}</button>
                <button className={filter === 'DEPARTMENT_HEAD' ? 'btn-confirm-pro' : 'btn-cancel-pro'} onClick={() => setFilter('DEPARTMENT_HEAD')} style={{ padding: '10px 24px', fontSize: '13px' }}>{t('roles.DEPARTMENT_HEAD')}</button>

                <div style={{ height: '24px', width: '1px', background: '#e2e8f0', margin: '0 8px' }}></div>

                <select
                  className="mnadm-input"
                  value={filter.startsWith('dept_') ? filter : ''}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    width: 'auto',
                    minWidth: '220px',
                    height: '42px',
                    background: filter.startsWith('dept_') ? 'var(--p-indigo)' : 'white',
                    color: filter.startsWith('dept_') ? 'white' : 'var(--text-main)',
                    fontWeight: '700'
                  }}
                >
                  <option value="" hidden>{t('sidebar.departments')}</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={`dept_${dept.id}`} style={{ color: 'black' }}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="search-box" style={{ flex: '0 1 350px' }}>
                <div className="mnadm-search-wrapper">
                  <span className="search-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </span>
                  <input
                    type="text"
                    placeholder={t('common.search') || 'Search...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mnadm-input"
                  />
                </div>
              </div>
            </div>

            <div className="modern-table-wrapper">
              {loading ? (
                <div className="loading-spinner" style={{ padding: '60px' }}>{t('common.loadingData')}</div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '100px' }}>{t('common.id')}</th>
                      <th style={{ width: '250px' }}>{t('common.fullName')}</th>
                      <th style={{ width: '250px' }}>{t('common.email')}</th>
                      <th style={{ width: '200px' }}>{t('common.department')}</th>
                      <th style={{ width: '180px' }}>{t('common.role')}</th>
                      <th style={{ width: '150px' }}>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => {
                        const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                        if (!matchesSearch) return false;

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
                          <td style={{ color: 'var(--text-muted)', fontWeight: '600' }}>#{u.id}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="user-avatar-mini" style={{ width: '32px', height: '32px' }}>
                                {u.nom[0]}{u.prenom[0]}
                              </div>
                              <strong>{u.nom} {u.prenom}</strong>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>{u.department_name || '-'}</td>
                          <td><span className={`role-tag role-${u.role.toLowerCase()}`}>{t('roles.' + u.role) || u.role}</span></td>
                          <td>
                            {u.role !== 'RH_MANAGER' && (
                              <button className="btn-delete-pro" onClick={() => handleDelete(u.id, u.nom)}>
                                {t('common.delete')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {users.length === 0 && (
                      <tr><td colSpan="7" className="empty-state" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>{t('hr.noEmployeesFound')}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardHR;
