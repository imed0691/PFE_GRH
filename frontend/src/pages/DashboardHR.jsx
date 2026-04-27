import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AddEmployee from './AddEmployee';
import ManageDepartments from './ManageDepartments';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageSalaries from './ManageSalaries';
import ManageReminders from './ManageReminders';
import ManageDocuments from './ManageDocuments';
import ManagePromotions from './ManagePromotions';
import ManageRecruitments from './ManageRecruitments';
import ManageEvaluations from './ManageEvaluations';
import ManageResearch from './ManageResearch';
import NotificationFeed from './NotificationFeed';
import Settings from './Settings';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import './DashboardHR.css';

function DashboardHR({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [view, setViewRaw] = useState('list');
  const [loading, setLoading] = useState(true);
  const [unreadAbsences, setUnreadAbsences] = useState(0);
  const { badges, markSeen } = useNotificationBadges();
  const { t, locale } = useLanguage();

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

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`${t('hr.confirmDelete')} ${nom}?`)) return;

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

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>PFE_GRH</h2>
        </div>
        
        <div className="user-profile">
          <div className="avatar">{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info">
            <h4>{user.prenom} {user.nom}</h4>
            <span className="badge-role">{t('roles.RH_MANAGER')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>{t('sidebar.staffList')}</button>
          <button className={`nav-item ${view === 'add' ? 'active' : ''}`} onClick={() => setView('add')}>{t('sidebar.addEmployee')}</button>
          <button className={`nav-item ${view === 'departments' ? 'active' : ''}`} onClick={() => setView('departments')}>{t('sidebar.departments')}</button>
          <button className={`nav-item ${view === 'sessions' ? 'active' : ''}`} onClick={() => setView('sessions')}>{t('sidebar.sessions')}</button>
          <button className={`nav-item ${view === 'absences' ? 'active' : ''}`} onClick={() => setView('absences')}>{t('sidebar.absences')} <NotifBadge count={unreadAbsences || badges.absences} /></button>
          <button className={`nav-item ${view === 'salaries' ? 'active' : ''}`} onClick={() => setView('salaries')}>{t('sidebar.salaries')}</button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.reminders')}</button>
          <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => setView('documents')}>{t('sidebar.documents')} <NotifBadge count={badges.documents} /></button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => setView('promotions')}>{t('sidebar.promotions')} <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'recruitment' ? 'active' : ''}`} onClick={() => setView('recruitment')}>{t('sidebar.recruitment')} <NotifBadge count={badges.recruitments} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => setView('evaluations')}>{t('sidebar.evaluations')} <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'research' ? 'active' : ''}`} onClick={() => setView('research')}>{t('sidebar.research')} <NotifBadge count={badges.research} /></button>
          <button className={`nav-item ${view === 'feed' ? 'active' : ''}`} onClick={() => setView('feed')}>{t('sidebar.activityFeed')}</button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>

        <button className="btn-logout" onClick={onLogout}>
          {t('common.logout')}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h1>
            {view === 'list' ? t('topbar.personnelManagement') : 
             view === 'add' ? t('topbar.newHire') : 
             view === 'departments' ? t('topbar.manageDepartments') : 
             view === 'sessions' ? t('topbar.academicSessions') :
             view === 'absences' ? t('topbar.absencesManagement') :
             view === 'salaries' ? t('topbar.salaryCalculation') :
             view === 'documents' ? t('topbar.documentRequests') :
             view === 'promotions' ? t('topbar.careerAdvancements') :
             view === 'recruitment' ? t('topbar.recruitmentManagement') :
             view === 'evaluations' ? t('topbar.performanceEvaluations') :
             view === 'research' ? t('topbar.researchActivities') :
             view === 'settings' ? t('settings.title') :
             t('topbar.sendReminders')}
          </h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
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
          ) : view === 'absences' ? (
            <ManageAbsences />
          ) : view === 'salaries' ? (
            <ManageSalaries />
          ) : view === 'documents' ? (
            <ManageDocuments user={user} />
          ) : view === 'promotions' ? (
            <ManagePromotions user={user} />
          ) : view === 'recruitment' ? (
            <ManageRecruitments user={user} />
          ) : view === 'evaluations' ? (
            <ManageEvaluations user={user} />
          ) : view === 'research' ? (
            <ManageResearch user={user} />
          ) : view === 'feed' ? (
            <NotificationFeed />
          ) : view === 'reminders' ? (
            <ManageReminders />
          ) : view === 'settings' ? (
            <Settings user={user} onProfileUpdate={handleProfileUpdate} />
          ) : (
            <div className="table-card">
              {loading ? (
                <div className="loading-spinner">{t('common.loadingData')}</div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>{t('common.id')}</th>
                      <th>{t('common.fullName')}</th>
                      <th>{t('common.email')}</th>
                      <th>{t('common.department')}</th>
                      <th>{t('common.role')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.nom}</strong> {u.prenom}</td>
                        <td>{u.email}</td>
                        <td>{u.department_name || '-'}</td>
                        <td><span className={`role-tag role-${u.role.toLowerCase()}`}>{t('roles.' + u.role) || u.role}</span></td>
                        <td>
                          {u.role !== 'RH_MANAGER' && (
                            <button className="btn-delete" onClick={() => handleDelete(u.id, u.nom)}>
                              {t('common.delete')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan="5" className="empty-state">{t('hr.noEmployeesFound')}</td></tr>
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
