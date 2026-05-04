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
    { id: 'sessions', label: t('sidebar.sessions') || 'Scolarité' },
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
        ) : view === 'sessions' ? (
          <ManageSessions />
        ) : view === 'reminders' ? (
          <ManageReminders />
        ) : view === 'settings' ? (
          <Settings user={user} onProfileUpdate={() => window.location.reload()} />
        ) : (
          <div className="card-academic">
            <h2 className="academic-title">{t('sidebar.staff') || 'Faculty Staff'}</h2>
            <div className="table-academic-wrapper">
              {loading ? (
                <div className="loading-spinner-academic"></div>
              ) : (
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
                        <td><span className="badge-academic badge-gold">{u.role}</span></td>
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
