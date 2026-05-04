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
            <h2 className="academic-title">{t('sidebar.staff') || 'Staff Directory'}</h2>
            <div className="table-academic-wrapper">
              <table className="table-academic">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>#{u.id}</td>
                      <td style={{ fontWeight: '700' }}>{u.nom} {u.prenom}</td>
                      <td>{u.email}</td>
                      <td>{u.department_name || '-'}</td>
                      <td><span className="badge-academic badge-indigo">{u.role}</span></td>
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
