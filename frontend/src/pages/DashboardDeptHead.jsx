import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import ManageResearch from './ManageResearch';
import ManageRecruitments from './ManageRecruitments';
import NotificationFeed from './NotificationFeed';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';
import './DashboardDeptHead.css';

function DashboardDeptHead({ user, onLogout }) {
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

  const setView = (newView) => { setViewRaw(newView); if (badges[newView] && badges[newView] > 0) markSeen(newView); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setUsers(data.filter(u => (u.role === 'TEACHER' || u.role === 'ENSEIGNANT') && u.department_id === user.department_id)); }
    } catch (error) { toast.error(t('deptHead.errorFetchTeachers')); } finally { setLoading(false); }
  };

  const fetchUnreadAbsences = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const absences = await res.json(); setUnreadAbsences(absences.filter(a => !a.is_read_by_admin).length); }
    } catch (error) { console.error(error); }
  };

  const markAbsencesAsRead = async () => {
    if (unreadAbsences === 0) return;
    try { const token = localStorage.getItem('token'); await fetch('http://localhost:5000/api/absences/read-admin', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }); setUnreadAbsences(0); } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchUnreadAbsences(); }, []);
  useEffect(() => { if (view === 'list') fetchUsers(); if (view === 'absences') markAbsencesAsRead(); }, [view]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h2>PFE_GRH</h2></div>
        <div className="user-profile">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>{user.prenom[0]}{user.nom[0]}</div>
          <div className="user-info"><h4>{user.prenom} {user.nom}</h4><span className="badge-role" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>{t('roles.DEPARTMENT_HEAD')}</span></div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>{t('sidebar.teachers')}</button>
          <button className={`nav-item ${view === 'sessions' ? 'active' : ''}`} onClick={() => setView('sessions')}>{t('sidebar.schedules')}</button>
          <button className={`nav-item ${view === 'absences' ? 'active' : ''}`} onClick={() => setView('absences')}>{t('sidebar.absences')} <NotifBadge count={unreadAbsences || badges.absences} /></button>
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.notifications')}</button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => setView('promotions')}>{t('sidebar.promotions')} <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => setView('documents')}>{t('sidebar.documents')} <NotifBadge count={badges.documents} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => setView('evaluations')}>{t('sidebar.evaluations')} <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'research' ? 'active' : ''}`} onClick={() => setView('research')}>{t('sidebar.research')} <NotifBadge count={badges.research} /></button>
          <button className={`nav-item ${view === 'recruitments' ? 'active' : ''}`} onClick={() => setView('recruitments')}>{t('sidebar.recruitment')} <NotifBadge count={badges.recruitments} /></button>
          <button className={`nav-item ${view === 'feed' ? 'active' : ''}`} onClick={() => setView('feed')}>{t('sidebar.activityFeed')}</button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'list' ? t('topbar.teachersDirectory') : view === 'sessions' ? t('topbar.departmentSchedules') : view === 'absences' ? t('topbar.absenceValidations') : view === 'promotions' ? t('topbar.teacherPromotions') : view === 'documents' ? t('topbar.documentsManagement') : view === 'evaluations' ? t('topbar.teacherEvaluations') : view === 'research' ? t('topbar.researchActivities') : view === 'recruitments' ? t('topbar.staffRecruitment') : view === 'settings' ? t('settings.title') : t('topbar.departmentNotifications')}</h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div className="content-area">
          {view === 'sessions' ? <ManageSessions /> : view === 'absences' ? <ManageAbsences /> : view === 'promotions' ? <ManagePromotions user={user} /> : view === 'documents' ? <ManageDocuments user={user} /> : view === 'evaluations' ? <ManageEvaluations user={user} /> : view === 'research' ? <ManageResearch user={user} /> : view === 'recruitments' ? <ManageRecruitments user={user} /> : view === 'feed' ? <NotificationFeed /> : view === 'reminders' ? <ManageReminders /> : view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
            <div className="table-card">
              <div className="card-header"><h3>{t('deptHead.teachersInDept')}</h3><p>{t('deptHead.viewActiveStaff')}</p></div>
              {loading ? <div className="loading-spinner">{t('common.loadingData')}</div> : (
                <table className="modern-table">
                  <thead><tr><th>{t('common.id')}</th><th>{t('common.fullName')}</th><th>{t('common.email')}</th><th>{t('common.department')}</th><th>{t('common.role')}</th></tr></thead>
                  <tbody>
                    {users.map(u => (<tr key={u.id}><td>#{u.id}</td><td><strong>{u.nom}</strong> {u.prenom}</td><td>{u.email}</td><td>{u.department_name || '-'}</td><td><span className={`role-tag role-${u.role.toLowerCase()}`}>{t('roles.' + u.role) || u.role}</span></td></tr>))}
                    {users.length === 0 && <tr><td colSpan="5" className="empty-state">{t('deptHead.noTeachersFound')}</td></tr>}
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
