import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageDepartments from './ManageDepartments';
import ManageReminders from './ManageReminders';
import Settings from './Settings';
import './DashboardRector.css';

function DashboardRector({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { t } = useLanguage();

  // Overview stats
  const [teachersCount, setTeachersCount] = useState(0);
  const [deansCount, setDeansCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);

  const [view, setView] = useState(localStorage.getItem('rector_view') || 'overview');
  const [loading, setLoading] = useState(true);

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

      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setUsers(usersData);
        setTeachersCount(usersData.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length);
        setDeansCount(usersData.filter(u => ['DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN'].includes(u.role)).length);
      }
      if (resSessions.ok) {
        const sessions = await resSessions.json();
        setSessionsCount(sessions.length);
      }
      if (resDepts.ok) {
        const deptsData = await resDepts.json();
        setDepartments(deptsData);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('rector_view', newView);
  };

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview') || 'Vue d\'ensemble' },
    { id: 'directory', label: t('sidebar.staff') || 'Personnel' },
    { id: 'departments', label: t('sidebar.faculties') || 'Facultés & Dépts' },
    { id: 'reminders', label: t('sidebar.reminders') || 'Communications' },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'overview': return t('sidebar.overview') || 'Tableau de Bord Recteur';
      case 'directory': return t('sidebar.staff') || 'Annuaire du Personnel';
      case 'departments': return t('sidebar.faculties') || 'Structure Universitaire';
      case 'reminders': return t('sidebar.reminders') || 'Communications Officielles';
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
          loading ? (
            <div className="loading-spinner-academic"></div>
          ) : (
            <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Total Staff</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--p-indigo)', margin: 0 }}>{users.length}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #10b981' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Teachers</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: 0 }}>{teachersCount}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #f59e0b' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Deans & Vice-Deans</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', margin: 0 }}>{deansCount}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #8b5cf6' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Departments</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#8b5cf6', margin: 0 }}>{departments.length}</p>
              </div>
            </div>
          )
        ) : view === 'directory' ? (
          <div className="card-academic">
            <h2 className="academic-title" style={{ marginBottom: '24px' }}>{t('sidebar.staff') || 'Staff Directory'}</h2>
            <div className="table-academic-wrapper">
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
            </div>
          </div>
        ) : view === 'departments' ? (
          <ManageDepartments />
        ) : view === 'reminders' ? (
          <ManageReminders />
        ) : view === 'settings' ? (
          <Settings user={user} onProfileUpdate={() => window.location.reload()} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default DashboardRector;
