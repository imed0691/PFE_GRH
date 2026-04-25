import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ManageDepartments from './ManageDepartments';
import ManageSessions from './ManageSessions';
import ManageReminders from './ManageReminders';
import './DashboardDean.css';

function DashboardDean({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [view, setView] = useState('overview'); // 'overview', 'departments', 'sessions', 'staff', 'reminders'
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
    if (view === 'staff' || view === 'overview') {
      fetchUsers();
    }
    if (view === 'overview') {
      fetchDepartments();
    }
  }, [view]);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🏛️</div>
          <h2>PFE_GRH</h2>
        </div>

        <div className="user-profile">
          <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role" style={{ background: 'rgba(254, 243, 199, 0.2)', color: '#fef3c7' }}>Dean</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`nav-item ${view === 'departments' ? 'active' : ''}`}
            onClick={() => setView('departments')}
          >
            🏢 Departments
          </button>
          <button
            className={`nav-item ${view === 'sessions' ? 'active' : ''}`}
            onClick={() => setView('sessions')}
          >
            📚 Academic Affairs
          </button>
          <button
            className={`nav-item ${view === 'staff' ? 'active' : ''}`}
            onClick={() => setView('staff')}
          >
            👥 Human Resources
          </button>
          <button
            className={`nav-item ${view === 'reminders' ? 'active' : ''}`}
            onClick={() => setView('reminders')}
          >
            📢 Communications
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
            {view === 'overview' ? 'Faculty Dashboard' :
              view === 'departments' ? 'Manage Departments' :
                view === 'sessions' ? 'Schedules & Sessions' :
                  view === 'staff' ? 'Faculty Staff' :
                    'Communications & Reminders'}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {view === 'overview' ? (
            <div className="overview-grid">
              <div className="stat-card">
                <h3>Total Departments</h3>
                <p className="stat-value">{departments.length || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Staff</h3>
                <p className="stat-value">{users.length || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Teachers</h3>
                <p className="stat-value">{users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length || 0}</p>
              </div>
            </div>
          ) : view === 'departments' ? (
            <ManageDepartments />
          ) : view === 'sessions' ? (
            <ManageSessions />
          ) : view === 'reminders' ? (
            <ManageReminders />
          ) : (
            <div className="table-card">
              {loading ? (
                <div className="loading-spinner">Loading...</div>
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
                      <tr><td colSpan="5" className="empty-state">No employees found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardDean;
