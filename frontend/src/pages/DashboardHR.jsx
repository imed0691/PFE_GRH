import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AddEmployee from './AddEmployee';
import ManageDepartments from './ManageDepartments';
import ManageSessions from './ManageSessions';
import './DashboardHR.css';

function DashboardHR({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'add', or 'departments'
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
      toast.error("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchUsers();
    }
  }, [view]);

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Are you sure you want to delete ${nom}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("User deleted");
        fetchUsers(); // Refresh list
      } else {
        toast.error("Error deleting user");
      }
    } catch (error) {
      toast.error("Server error");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🎓</div>
          <h2>PFE_GRH</h2>
        </div>
        
        <div className="user-profile">
          <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role">HR Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            📋 Staff List
          </button>
          <button 
            className={`nav-item ${view === 'add' ? 'active' : ''}`}
            onClick={() => setView('add')}
          >
            ➕ Add Employee
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
            📚 Academic Sessions
          </button>
        </nav>

        <button className="btn-logout" onClick={onLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'list' ? 'Personnel Management' : view === 'add' ? 'New Hire' : view === 'departments' ? 'Manage Departments' : 'Academic Sessions'}</h1>
          <div className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {view === 'add' ? (
            <AddEmployee 
              onCancel={() => setView('list')} 
              onSuccess={() => setView('list')} 
            />
          ) : view === 'departments' ? (
            <ManageDepartments />
          ) : view === 'sessions' ? (
            <ManageSessions />
          ) : (
            <div className="table-card">
              {loading ? (
                <div className="loading-spinner">Loading data...</div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Actions</th>
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
                        <td>
                          {u.role !== 'RH_MANAGER' && (
                            <button className="btn-delete" onClick={() => handleDelete(u.id, u.nom)}>
                              Delete
                            </button>
                          )}
                        </td>
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

export default DashboardHR;
