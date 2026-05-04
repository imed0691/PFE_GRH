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
import ConfirmModal from '../components/ConfirmModal';
import './DashboardHR.css';

function DashboardHR({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setViewRaw] = useState('list');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();
  const { t, locale } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

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

  const handleDelete = (id, nom) => {
    setConfirmModal({ isOpen: true, id, name: nom });
  };

  const performDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
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
      <div>
        {view === 'add' ? (
          <AddEmployee onCancel={() => setView('list')} onSuccess={() => setView('list')} />
        ) : view === 'departments' ? (
          <ManageDepartments />
        ) : view === 'classes' ? (
          <ManageClasses user={user} />
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
            <div className="list-controls-pro">
              <div className="filter-group-pro">
                <div className="role-filters">
                  <button className={roleFilter === 'all' && deptFilter === 'all' ? 'btn-pill active' : 'btn-pill'} onClick={() => { setRoleFilter('all'); setDeptFilter('all'); }}>{t('common.all')}</button>
                  <button className={roleFilter === 'DIRECTION' ? 'btn-pill active' : 'btn-pill'} onClick={() => { setRoleFilter('DIRECTION'); setDeptFilter('all'); }}>{t('hr.direction')}</button>
                </div>

                <div className="filter-divider"></div>

                <div className="dept-filter-wrapper">
                  <select
                    className="mnadm-input-select"
                    value={deptFilter}
                    onChange={(e) => { setDeptFilter(e.target.value); setRoleFilter('all'); }}
                  >
                    <option value="all">{t('sidebar.departments')} ({t('common.all')})</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name && dept.name !== 'null' ? (
                          (() => {
                            const translated = t('departments.' + dept.name);
                            return translated.includes('.') ? dept.name : translated;
                          })()
                        ) : '-'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="search-box-pro">
                <div className="search-wrapper-pro">
                  <span className="search-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </span>
                  <input
                    type="text"
                    placeholder={t('common.search') || 'Rechercher...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-modern"
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
                      <th style={{ width: '80px' }}>{t('common.id') || '#ID'}</th>
                      <th>{t('common.fullName')}</th>
                      <th>{t('common.department')}</th>
                      <th>{t('common.role')}</th>
                      <th>{t('common.grade')}</th>
                      <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => {
                        const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                        if (!matchesSearch) return false;

                        // Role filter
                        let matchesRole = true;
                        if (roleFilter === 'DIRECTION') {
                          matchesRole = ['DEAN', 'VICE_DEAN', 'RECTOR', 'VICE_RECTOR', 'DEPARTMENT_HEAD', 'DOYEN', 'CHEF_DEPARTEMENT', 'RECTEUR'].includes(u.role);
                        } else if (roleFilter !== 'all') {
                          matchesRole = u.role === roleFilter;
                        }

                        // Dept filter
                        let matchesDept = true;
                        if (deptFilter !== 'all') {
                          matchesDept = u.department_id === parseInt(deptFilter);
                        }

                        return matchesRole && matchesDept;
                      })
                      .sort((a, b) => {
                        // 1. Role Hierarchy (Strict)
                        const roleOrder = {
                          'RECTOR': 1, 'RECTEUR': 1,
                          'VICE_RECTOR': 2,
                          'DEAN': 3, 'DOYEN': 3,
                          'VICE_DEAN': 4,
                          'DEPARTMENT_HEAD': 5, 'CHEF_DEPARTEMENT': 5,
                          'TEACHER': 6, 'ENSEIGNANT': 6
                        };

                        const priorityA = roleOrder[a.role] || 99;
                        const priorityB = roleOrder[b.role] || 99;

                        if (priorityA !== priorityB) return priorityA - priorityB;

                        // 2. Grade Seniority (for Teachers)
                        if (priorityA === 6) {
                          const gradeOrder = {
                            'Professeur': 1,
                            'Maître de Conférences A': 2,
                            'Maître de Conférences B': 3,
                            'Maître-Assistant A': 4,
                            'Maître-Assistant B': 5,
                            'Assistant': 6,
                            'Vacataire': 7,
                            'Teacher': 8
                          };
                          const gA = gradeOrder[a.grade] || 99;
                          const gB = gradeOrder[b.grade] || 99;
                          if (gA !== gB) return gA - gB;
                        }

                        // 3. Alphabetical (fallback)
                        return (a.nom || '').localeCompare(b.nom || '');
                      })
                      .map((u) => (
                        <tr key={u.id} className="table-row-animate">
                          <td><span className="id-badge">#{u.id}</span></td>
                          <td>
                            <div className="user-profile-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="avatar-circle" style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px', 
                                background: 'linear-gradient(135deg, var(--p-indigo), #6366f1)', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontWeight: '800', 
                                fontSize: '14px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}>
                                {(u.nom?.[0] || '')+(u.prenom?.[0] || '')}
                              </div>
                              <div className="user-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="user-name" style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                                  {u.nom} {u.prenom}
                                </span>
                                <span className="user-email" style={{ 
                                  color: '#64748b', 
                                  fontSize: '12px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px' 
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="dept-tag">
                              {u.department_name && u.department_name !== 'null' ? (
                                (() => {
                                  const translated = t('departments.' + u.department_name);
                                  return translated.includes('.') ? u.department_name : translated;
                                })()
                              ) : '-'}
                            </span>
                          </td>
                          <td>
                            <span className={`role-badge role-${(u.role || '').toLowerCase()}`}>
                              {t('roles.' + u.role) || u.role}
                            </span>
                          </td>
                          <td>
                            <span className="grade-tag" style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600' }}>
                              {['TEACHER', 'ENSEIGNANT'].includes(u.role) ? (u.grade ? (t('grades.' + u.grade) || u.grade) : '-') : '-'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              {u.role !== 'RH_MANAGER' && (
                                <button 
                                  className="btn-delete-pro" 
                                  onClick={() => handleDelete(u.id, u.nom)}
                                  title={t('common.delete')}
                                  style={{ padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {users.length === 0 && (
                      <tr><td colSpan="7" className="empty-state-cell">{t('hr.noEmployeesFound')}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
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
