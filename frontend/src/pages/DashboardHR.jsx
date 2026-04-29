import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import DashboardLayout from '../components/DashboardLayout';
import AddEmployee from './AddEmployee';
import ManageDepartments from './ManageDepartments';
import ManageClasses from './ManageClasses';
import ManageSalaries from './ManageSalaries';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import useNotificationBadges from '../hooks/useNotificationBadges';
import Settings from './Settings';
import './DashboardHR.css';

function DashboardHR({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [view, setViewRaw] = useState(localStorage.getItem('hr_dashboard_view') || 'list');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();
  const { t } = useLanguage();
  const lastClearedView = useRef(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => {
    setViewRaw(newView);
    localStorage.setItem('hr_dashboard_view', newView);
    if (badges[newView] && badges[newView] > 0) markSeen(newView);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (error) { toast.error(t('hr.errorFetchEmployees')); } finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/departments', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setDepartments(data);
    } catch (error) { console.error(error); }
  };

  const handleDeleteClick = (id, name) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const performDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { toast.success(t('hr.deleteSuccess')); fetchUsers(); } else { toast.error(t('hr.deleteError')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchUsers();
      fetchDepartments();
    }
    // Mark as seen when entering a view with notifications
    if (view !== lastClearedView.current && badges[view] > 0) {
      markSeen(view);
      lastClearedView.current = view;
    }
  }, [view, badges[view]]);

  const menuItems = [
    { id: 'list', label: t('sidebar.employees') },
    { id: 'add', label: t('sidebar.addEmployee') },
    { id: 'departments', label: t('sidebar.departments') },
    { id: 'classes', label: t('sidebar.classes') },
    { id: 'salaries', label: t('sidebar.salaries') },
    { id: 'reminders', label: t('sidebar.reminders'), badge: badges.reminders },
    { id: 'documents', label: t('sidebar.documents'), badge: badges.documents },
    { id: 'promotions', label: t('sidebar.promotions'), badge: badges.promotions },
    { id: 'settings', label: t('settings.title') },
  ];

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={setView}
      menuItems={menuItems}
      onLogout={onLogout}
      title={view === 'settings' ? t('settings.title') : t('sidebar.humanResources')}
    >
      <div className="animate-float">
        {view === 'add' ? <AddEmployee onEmployeeAdded={() => setView('list')} /> :
          view === 'departments' ? <ManageDepartments /> :
            view === 'classes' ? <ManageClasses /> :
              view === 'salaries' ? <ManageSalaries /> :
                view === 'promotions' ? <ManagePromotions user={user} /> :
                  view === 'documents' ? <ManageDocuments user={user} /> :
                    view === 'reminders' ? <ManageReminders user={user} /> :
                      view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
                        <div className="staff-view animate-mnadm">
                          <div className="stats-row grid-responsive" style={{ marginBottom: '32px' }}>
                            <div className="card-academic">
                              <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('hr.totalStaff')}</h4>
                              <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--p-indigo)' }}>{users.length}</p>
                            </div>
                            <div className="card-academic">
                              <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('sidebar.departments')}</h4>
                              <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--p-purple)' }}>{departments.length}</p>
                            </div>
                            <div className="card-academic">
                              <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('hr.faculty')}</h4>
                              <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--p-indigo)' }}>{users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length}</p>
                            </div>
                          </div>

                          <div className="card-academic" style={{ padding: '32px' }}>
                            <div className="grid-responsive" style={{ marginBottom: '32px', alignItems: 'center' }}>
                              <div>
                                <h2 style={{ fontSize: '24px', margin: 0 }}>{t('hr.staffDirectory')}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('sidebar.staffDirectory')}</p>
                              </div>

                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <select
                                  className="filter-select"
                                  value={filter}
                                  onChange={(e) => setFilter(e.target.value)}
                                  style={{ width: '100%', flex: 1 }}
                                >
                                  <option value="all">{t('hr.allRoles')}</option>
                                  <option value="direction">{t('hr.boardMembers')}</option>
                                  {departments.map(d => <option key={d.id} value={`dept_${d.id}`}>{t('departments.' + d.name) || d.name}</option>)}
                                </select>

                                <div style={{ position: 'relative', width: '100%', flex: 2 }}>
                                  <input
                                    type="text"
                                    placeholder={t('hr.searchPersonnel')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '40px', width: '100%' }}
                                  />
                                  <span style={{ position: 'absolute', left: '16px', top: '12px' }}>🔍</span>
                                </div>
                              </div>
                            </div>

                            <div className="table-scroll-pro">
                              <table className="table-academic">
                                <thead>
                                  <tr>
                                    <th>{t('hr.personnel')}</th>
                                    <th>{t('common.email')}</th>
                                    <th>{t('common.department')}</th>
                                    <th>{t('common.role')}</th>
                                    <th style={{ textAlign: 'center' }}>{t('hr.actions')}</th>
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
                                      if (filter.startsWith('dept_')) {
                                        const deptId = parseInt(filter.split('_')[1]);
                                        return u.department_id === deptId && (u.role === 'TEACHER' || u.role === 'ENSEIGNANT');
                                      }
                                      return true;
                                    })
                                    .map((u) => (
                                      <tr key={u.id}>
                                        <td data-label={t('hr.personnel')}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{u.nom} {u.prenom}</span>
                                            <div className="user-avatar-mini" style={{ width: '28px', height: '28px', fontSize: '10px', overflow: 'hidden', order: 2 }}>
                                              {u.profile_image ? (
                                                <img src={`http://localhost:5000${u.profile_image}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                              ) : (
                                                <>{u.prenom[0]}{u.nom[0]}</>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td data-label={t('common.email')} style={{ fontSize: '12px' }}>{u.email}</td>
                                        <td data-label={t('common.department')}>{t('departments.' + u.department_name) || u.department_name || '-'}</td>
                                        <td data-label={t('common.role')}>
                                          <span className="badge-academic-notif" style={{ background: '#eff6ff', color: 'var(--p-indigo)', padding: '2px 8px', fontSize: '11px' }}>
                                            {t('roles.' + u.role) || u.role}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          {u.role !== 'RH_MANAGER' && (
                                            <button onClick={() => handleDeleteClick(u.id, u.nom)} className="btn-delete" title={t('common.delete')}>
                                              {t('common.delete')}
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
      </div>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        message={`${t('hr.confirmDelete')} ${confirmModal.name}?`}
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </DashboardLayout>
  );
}

export default DashboardHR;
