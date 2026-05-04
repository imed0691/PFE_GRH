import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageDepartments from './ManageDepartments';
import ManageSessions from './ManageSessions';
import ManageReminders from './ManageReminders';
import Settings from './Settings';
import './DashboardDean.css';

function DashboardDean({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { t } = useLanguage();
  
  const [view, setView] = useState(localStorage.getItem('dean_view') || 'overview');
  const [loading, setLoading] = useState(true);

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
      toast.error("Error fetching staff data");
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
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('dean_view', newView);
  };

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview') || 'Aperçu' },
    { id: 'departments', label: t('sidebar.departments') || 'Départements' },
    { id: 'staff', label: t('sidebar.staff') || 'Personnel' },
    { id: 'reminders', label: t('sidebar.reminders') || 'Communications' },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'overview': return t('sidebar.overview') || 'Tableau de Bord Doyen';
      case 'departments': return t('sidebar.departments') || 'Gestion des Départements';
      case 'sessions': return t('sidebar.sessions') || 'Affaires Académiques';
      case 'staff': return t('sidebar.staff') || 'Personnel de la Faculté';
      case 'reminders': return t('sidebar.reminders') || 'Notifications & Rappels';
      case 'settings': return t('settings.title');
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={handleViewChange}
      menuItems={menuItems}
      onLogout={onLogout}
      title={getPageTitle()}
    >
      <div className="animate-mnadm">
        {view === 'overview' ? (
          <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Total Departments</h3>
              <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--p-indigo)', margin: 0 }}>{departments.length || 0}</p>
            </div>
            <div className="card-academic" style={{ borderTop: '4px solid #10b981' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Total Staff</h3>
              <p style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: 0 }}>{users.length || 0}</p>
            </div>
            <div className="card-academic" style={{ borderTop: '4px solid #f59e0b' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Teachers</h3>
              <p style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', margin: 0 }}>{users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length || 0}</p>
            </div>
          </div>
        ) : view === 'departments' ? (
          <ManageDepartments />
        ) : view === 'reminders' ? (
          <ManageReminders />
        ) : view === 'settings' ? (
          <Settings user={user} onProfileUpdate={() => window.location.reload()} />
        ) : (
          <div className="card-academic">
            <h2 className="academic-title" style={{ marginBottom: '24px' }}>{t('sidebar.staff') || 'Faculty Staff'}</h2>
            <div className="table-academic-wrapper">
              {loading ? (
                <div className="loading-spinner-academic"></div>
              ) : (
                <table className="table-academic">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>{t('common.id') || '#ID'}</th>
                      <th>{t('common.fullName')}</th>
                      <th>{t('common.department')}</th>
                      <th>{t('common.role')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .sort((a, b) => {
                        const roleOrder = {
                          'RECTOR': 1, 'RECTEUR': 1,
                          'VICE_RECTOR': 2,
                          'DEAN': 3, 'DOYEN': 3,
                          'VICE_DEAN': 4,
                          'DEPARTMENT_HEAD': 5, 'CHEF_DEPARTEMENT': 5,
                          'TEACHER': 6, 'ENSEIGNANT': 6
                        };
                        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
                      })
                      .map(u => (
                      <tr key={u.id}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardDean;
