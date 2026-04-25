import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ManageDepartments from './ManageDepartments';
import ManageReminders from './ManageReminders';
import './DashboardRector.css';

function DashboardRector({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Overview stats
  const [teachersCount, setTeachersCount] = useState(0);
  const [deansCount, setDeansCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);

  const [view, setView] = useState('overview'); // 'overview', 'directory', 'departments', 'reminders'
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch users, sessions, and departments for the overview
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
    if (view === 'overview' || view === 'directory') {
      fetchData();
    }
  }, [view]);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="sidebar-header">
          <div className="logo-icon">🏛️</div>
          <h2>PFE_GRH</h2>
        </div>

        <div className="user-profile">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
            {user.prenom[0]}{user.nom[0]}
          </div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role" style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#c7d2fe' }}>
              Rector
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            📊 University Overview
          </button>
          <button
            className={`nav-item ${view === 'directory' ? 'active' : ''}`}
            onClick={() => setView('directory')}
          >
            👥 Staff Directory
          </button>
          <button
            className={`nav-item ${view === 'departments' ? 'active' : ''}`}
            onClick={() => setView('departments')}
          >
            🏢 Faculties & Depts
          </button>
          <button
            className={`nav-item ${view === 'reminders' ? 'active' : ''}`}
            onClick={() => setView('reminders')}
          >
            📢 Official Communications
          </button>
        </nav>

        <button className="btn-logout" onClick={onLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h1>
            {view === 'overview' ? 'University Overview' :
              view === 'directory' ? 'Global Staff Directory' :
                view === 'departments' ? 'University Structure' :
                  'Official Communications'}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {view === 'overview' ? (
            loading ? (
              <div className="loading-spinner">Loading...</div>
            ) : (
              <div className="overview-grid">
                <div className="stat-card">
                  <h3>Total Staff</h3>
                  <p className="stat-value">{users.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Teachers</h3>
                  <p className="stat-value">{teachersCount}</p>
                </div>
                <div className="stat-card">
                  <h3>Deans & Vice-Deans</h3>
                  <p className="stat-value">{deansCount}</p>
                </div>
                <div className="stat-card">
                  <h3>Departments</h3>
                  <p className="stat-value">{departments.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Sessions</h3>
                  <p className="stat-value">{sessionsCount}</p>
                </div>
              </div>
            )
          ) : view === 'directory' ? (
            <div className="table-card">
              {loading ? (
                <div className="loading-spinner">Loading directory...</div>
              ) : (
                <table className="modern-table">
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
                        <td>#{u.id}</td>
                        <td><strong>{u.nom}</strong> {u.prenom}</td>
                        <td>{u.email}</td>
                        <td>{u.department_name || '-'}</td>
                        <td><span className={`role-tag role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan="5" className="empty-state">No staff found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          ) : view === 'departments' ? (
            <ManageDepartments />
          ) : view === 'reminders' ? (
            <ManageReminders />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default DashboardRector;
