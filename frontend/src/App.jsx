import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useLanguage } from './i18n/LanguageContext'
import './App.css'
import Login from './pages/Login'
import DashboardHR from './pages/DashboardHR'
import DashboardTeacher from './pages/DashboardTeacher'
import DashboardDeptHead from './pages/DashboardDeptHead'
import DashboardDean from './pages/DashboardDean'
import DashboardViceDean from './pages/DashboardViceDean'
import DashboardRector from './pages/DashboardRector'
import DashboardViceRector from './pages/DashboardViceRector'
import ChangePasswordModal from './components/ChangePasswordModal'

function App() {
  const [user, setUser] = useState(null);
  const { t } = useLanguage();

  // Check if a user is already logged in on page reload
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser || !parsedUser.role) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const handlePasswordChanged = () => {
    const updatedUser = { ...user, must_change_password: 0 };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <Login onLoginSuccess={(u) => setUser(u)} />
      </>
    );
  }

  // Force password change on first login (Exempt RH_MANAGER)
  if (user.must_change_password && user.role !== 'RH_MANAGER') {
    return (
      <>
        <Toaster position="top-center" />
        <ChangePasswordModal onPasswordChanged={handlePasswordChanged} />
      </>
    );
  }

  // Redirect to special Dashboard for HR Manager
  if (user.role === 'RH_MANAGER') {
    return (
      <>
        <Toaster position="top-right" />
        <DashboardHR user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Redirect to Teacher Dashboard
  if (user.role === 'TEACHER' || user.role === 'ENSEIGNANT') {
    return (
      <>
        <Toaster position="top-right" />
        <DashboardTeacher user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Redirect to Department Head Dashboard
  if (user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT') {
    return (
      <>
        <Toaster position="top-right" />
        <DashboardDeptHead user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Redirect to Dean Dashboard
  if (user.role === 'DEAN' || user.role === 'DOYEN') {
    return (
      <>
        <Toaster position="top-right" />
        <DashboardDean user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Redirect to Vice Dean Dashboard
  if (user.role === 'VICE_DEAN' || user.role === 'VICE_DOYEN') {
    return (
      <>
        <Toaster position="top-right" />
        <DashboardViceDean user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Redirect to Rector Dashboard
  if (user.role === 'RECTOR' || user.role === 'RECTEUR') {
    return (
      <>
        <Toaster position="top-right" />
        <DashboardRector user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Redirect to Vice Rector Dashboard
  if (user.role === 'VICE_RECTOR' || user.role === 'VICE_RECTEUR') {
    return (
      <>
        <Toaster position="top-right" />
        <DashboardViceRector user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Standard view for other employees
  return (
    <div className="container">
      <Toaster position="top-right" />

      <div className="content" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>{t('app.personalSpace')}</h2>
        <h3>{t('app.welcomeUser')} {user.prenom} {user.nom}</h3>
        <p style={{ marginTop: '10px', color: '#666' }}>
          {t('app.loggedInAs')} <strong>{t('roles.' + user.role) || user.role}</strong>
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '5px' }}>
          {t('common.logout')}
        </button>
      </div>
    </div>
  )
}

export default App
