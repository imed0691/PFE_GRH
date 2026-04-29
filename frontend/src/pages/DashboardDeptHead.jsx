import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import useNotificationBadges from '../hooks/useNotificationBadges';
import NotifBadge from '../components/NotifBadge';
import Settings from './Settings';
import './DashboardDeptHead.css';

function DashboardDeptHead({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [view, setViewRaw] = useState('list');
  const [loading, setLoading] = useState(true);
  const [unreadAbsences, setUnreadAbsences] = useState(0);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [selectedTeacherName, setSelectedTeacherName] = useState('');
  const { badges, markSeen } = useNotificationBadges();
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchTeacherSchedule = async (teacher) => {
    setSelectedTeacherName(`${teacher.nom} ${teacher.prenom}`);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/teacher/dashboard/${teacher.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeacherSchedule(data.all_sessions || []);
        setView('teacher-schedule');
      }
    } catch (e) {
      toast.error(t('teacher.failedLoadDashboard'));
    } finally {
      setLoading(false);
    }
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
          <button className={`nav-item ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>{t('sidebar.notifications')} <NotifBadge count={badges.reminders} /></button>
          <button className={`nav-item ${view === 'promotions' ? 'active' : ''}`} onClick={() => setView('promotions')}>{t('sidebar.promotions')} <NotifBadge count={badges.promotions} /></button>
          <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => setView('documents')}>{t('sidebar.documents')} <NotifBadge count={badges.documents} /></button>
          <button className={`nav-item ${view === 'evaluations' ? 'active' : ''}`} onClick={() => setView('evaluations')}>{t('sidebar.evaluations')} <NotifBadge count={badges.evaluations} /></button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{t('settings.title')}</button>
        </nav>
        <button className="btn-logout" onClick={onLogout}>{t('common.logout')}</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>{view === 'list' ? t('topbar.teachersDirectory') : view === 'sessions' ? t('topbar.departmentSchedules') : view === 'absences' ? t('topbar.absenceValidations') : view === 'promotions' ? t('topbar.teacherPromotions') : view === 'documents' ? t('topbar.documentsManagement') : view === 'evaluations' ? t('topbar.teacherEvaluations') : view === 'settings' ? t('settings.title') : t('topbar.departmentNotifications')}</h1>
          <div className="date-display">{new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <div className="content-area">
          {view === 'sessions' ? <ManageSessions user={user} /> : 
           view === 'absences' ? <ManageAbsences user={user} /> : 
           view === 'promotions' ? <ManagePromotions user={user} /> : 
           view === 'documents' ? <ManageDocuments user={user} /> : 
           view === 'evaluations' ? <ManageEvaluations user={user} /> : 
           view === 'reminders' ? (
             <>
               <ManageReminders user={user} />
               <ReminderInbox user={user} />
             </>
           ) : 
           view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : 
           view === 'teacher-schedule' ? (
             <div className="table-card">
               <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <h3>{t('teacher.weeklySchedule')}</h3>
                   <p>{selectedTeacherName}</p>
                 </div>
                 <button onClick={() => setView('list')} className="btn-small" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                   ← {t('common.cancel')}
                 </button>
               </div>
               
               {teacherSchedule.length > 0 ? (
                 <table className="modern-table">
                   <thead>
                     <tr>
                       <th>{t('teacher.day')}</th>
                       <th>{t('teacher.time')}</th>
                       <th>{t('teacher.module')}</th>
                       <th>{t('teacher.level')}</th>
                       <th>{t('teacher.type')}</th>
                       <th>{t('teacher.sectionGroup')}</th>
                     </tr>
                   </thead>
                   <tbody>
                     {teacherSchedule.map(s => (
                       <tr key={s.id}>
                         <td><strong>{t('sessions.' + s.day_of_week.toLowerCase()) || s.day_of_week}</strong></td>
                         <td>{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</td>
                         <td>{s.module_name}</td>
                         <td><span className="role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{s.study_level}</span></td>
                         <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{s.session_type === 'Lecture' ? t('teacher.lecture') : s.session_type === 'Tutorial' ? t('teacher.tutorial') : t('teacher.practical')}</span></td>
                         <td>
                           {(s.section || s.groupe) ? (
                             <span style={{ fontSize: '0.9em', color: '#64748b' }}>
                               {s.section && `Sec: ${s.section}`} {s.groupe && `Grp: ${s.groupe}`}
                             </span>
                           ) : '-'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div style={{ padding: '60px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                   <p style={{ margin: 0, fontSize: '1.1rem' }}>{t('teacher.noSessions')}</p>
                 </div>
               )}
             </div>
           ) : (
             <div className="table-card">
               <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <h3>{t('deptHead.teachersInDept')}</h3>
                   <p>{t('deptHead.viewActiveStaff')}</p>
                 </div>
                 <div className="search-box">
                   <input
                     type="text"
                     placeholder={t('common.search') || 'Search...'}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="search-input"
                     style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', width: '250px' }}
                   />
                 </div>
               </div>
               {loading ? <div className="loading-spinner">{t('common.loadingData')}</div> : (
                 <table className="modern-table">
                   <thead><tr><th>{t('addEmployee.lastName')}</th><th>{t('addEmployee.firstName')}</th><th>{t('common.email')}</th><th>{t('salaries.grade')}</th></tr></thead>
                   <tbody>
                     {users
                       .filter(u => {
                         const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                         return fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                       })
                       .map(u => (
                         <tr key={u.id} onClick={() => fetchTeacherSchedule(u)} style={{ cursor: 'pointer' }} className="clickable-row">
                           <td><strong>{u.nom}</strong></td>
                           <td>{u.prenom}</td>
                           <td>{u.email}</td>
                           <td><span className="grade-tag" style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{u.grade || 'Teacher'}</span></td>
                         </tr>
                       ))}
                     {users.filter(u => {
                       const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                       return fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
                     }).length === 0 && <tr><td colSpan="4" className="empty-state">{t('deptHead.noTeachersFound')}</td></tr>}
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
