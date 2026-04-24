import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import './DashboardDeptHead.css';

function DashboardDeptHead({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'sessions', 'absences', 'reminders'
  const [loading, setLoading] = useState(true);
  const [unreadAbsences, setUnreadAbsences] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Filter to mostly show teachers in the same department
        const teachers = data.filter(u => 
          (u.role === 'TEACHER' || u.role === 'ENSEIGNANT') && 
          u.department_id === user.department_id
        );
        setUsers(teachers);
      }
    } catch (error) {
      toast.error("Error fetching teachers");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadAbsences = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const absences = await res.json();
        const unreadCount = absences.filter(a => !a.is_read_by_admin).length;
        setUnreadAbsences(unreadCount);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAbsencesAsRead = async () => {
    if (unreadAbsences === 0) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/absences/read-admin', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnreadAbsences(0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUnreadAbsences();
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchUsers();
    }
    if (view === 'absences') {
      markAbsencesAsRead();
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
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {user.prenom[0]}{user.nom[0]}
          </div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Head of Department</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            👨‍🏫 Department Teachers
          </button>
          <button 
            className={`nav-item ${view === 'sessions' ? 'active' : ''}`}
            onClick={() => setView('sessions')}
          >
            📅 Academic Schedules
          </button>
          <button 
            className={`nav-item ${view === 'absences' ? 'active' : ''}`}
            onClick={() => setView('absences')}
          >
            ✔️ Validate Absences
            {unreadAbsences > 0 && (
               <span style={{background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: 'auto'}}>
                 {unreadAbsences}
               </span>
            )}
          </button>
          <button 
            className={`nav-item ${view === 'reminders' ? 'active' : ''}`}
            onClick={() => setView('reminders')}
          >
            📢 Send Notifications
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
            {view === 'list' ? 'Teachers Directory' : 
             view === 'sessions' ? 'Department Schedules' :
             view === 'absences' ? 'Absence Validations' :
             'Department Notifications'}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <div className="content-area">
          {view === 'sessions' ? (
            <ManageSessions />
          ) : view === 'absences' ? (
            <ManageAbsences />
          ) : view === 'reminders' ? (
            <ManageReminders />
          ) : (
            <div className="table-card">
              <div className="card-header">
                <h3>Teachers in your Department</h3>
                <p>View the list of active teaching staff</p>
              </div>
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
                      <tr><td colSpan="5" className="empty-state">No teachers found.</td></tr>
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

export default DashboardDeptHead;
