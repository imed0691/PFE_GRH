import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import useNotificationBadges from '../hooks/useNotificationBadges';
import Settings from './Settings';
import ManageClasses from './ManageClasses';
import { getNextOccurrence, formatShortDate } from '../utils/dateUtils';
import './DashboardDeptHead.css';

function DashboardDeptHead({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [view, setViewRaw] = useState(localStorage.getItem('dept_dashboard_view') || 'list');
  const [loading, setLoading] = useState(false);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [selectedTeacherName, setSelectedTeacherName] = useState('');
  const { badges, markSeen } = useNotificationBadges();
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();
  const lastClearedView = useRef(null);

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => { 
    setViewRaw(newView); 
    if (menuItems.find(m => m.id === newView)) {
      localStorage.setItem('dept_dashboard_view', newView);
    }
    if (badges[newView] && badges[newView] > 0) markSeen(newView); 
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { 
        const data = await res.json();
        setUsers(data.filter(u => (u.role === 'TEACHER' || u.role === 'ENSEIGNANT') && u.department_id === user.department_id)); 
      } else {
        toast.error('Failed to load teachers');
      }
    } catch (error) { 
      toast.error(t('deptHead.errorFetchTeachers')); 
    } finally { 
      setLoading(false); 
    }
  };


  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const fetchTeacherSchedule = async (teacher) => {
    setSelectedTeacher(teacher);
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
        setViewRaw('teacher-schedule');
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to load teacher schedule');
      }
    } catch (e) { 
      console.error('Fetch error:', e);
      toast.error(t('teacher.failedLoadDashboard') || 'Server connection failed'); 
    } finally { 
      setLoading(false); 
    }
  };

  const triggerCancelSession = (id) => {
    setSessionToDelete(id);
    setShowConfirmModal(true);
  };

  const handleCancelSession = async () => {
    if (!sessionToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/sessions/${sessionToDelete}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        toast.success(t('sessions.cancelled'));
        if (selectedTeacher) fetchTeacherSchedule(selectedTeacher);
      } else {
        toast.error(t('sessions.failedDelete') || 'Failed to cancel session');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setShowConfirmModal(false);
      setSessionToDelete(null);
    }
  };

  useEffect(() => { 
    if (view === 'list') fetchUsers(); 
  }, [view]);

  useEffect(() => {
    if (view !== lastClearedView.current && badges[view] > 0) {
      markSeen(view);
      lastClearedView.current = view;
    }
  }, [view, badges[view]]);

  const menuItems = [
    { id: 'list', label: t('sidebar.teachers') },
    { id: 'sessions', label: t('sidebar.schedules') },
    { id: 'classes', label: t('classes.tabTeachers') || 'Assigner Modules' },
    { id: 'absences', label: t('sidebar.absences'), badge: badges.absences },
    { id: 'reminders', label: t('sidebar.notifications'), badge: badges.reminders },
    { id: 'promotions', label: t('sidebar.promotions'), badge: badges.promotions },
    { id: 'documents', label: t('sidebar.documents'), badge: badges.documents },
    { id: 'evaluations', label: t('sidebar.evaluations'), badge: badges.evaluations },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'list': return t('topbar.teachersDirectory');
      case 'sessions': return t('topbar.departmentSchedules');
      case 'classes': return t('classes.title');
      case 'absences': return t('topbar.absenceValidations');
      case 'promotions': return t('topbar.careerAdvancements');
      case 'documents': return t('topbar.documentsManagement');
      case 'evaluations': return t('topbar.teacherEvaluations');
      case 'settings': return t('settings.title');
      case 'reminders': return t('topbar.departmentNotifications');
      case 'teacher-schedule': return t('topbar.teacherSchedule');
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={setView}
      menuItems={menuItems}
      onLogout={onLogout}
      title={getPageTitle()}
    >
      <div className="animate-academic">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '20px' }}>
            <div className="spinner-academic"></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('common.loadingData')}</p>
          </div>
        ) : (
          <>
            {view === 'sessions' ? <ManageSessions user={user} /> : 
             view === 'classes' ? <ManageClasses user={user} /> :
             view === 'absences' ? <ManageAbsences user={user} /> : 
             view === 'promotions' ? <ManagePromotions user={user} /> : 
             view === 'documents' ? <ManageDocuments user={user} /> : 
             view === 'evaluations' ? <ManageEvaluations user={user} /> : 
             view === 'reminders' ? <ManageReminders user={user} /> : 
             view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : 
             view === 'teacher-schedule' ? (
              <div className="card-academic">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <h3 className="academic-title" style={{ margin: 0 }}>{selectedTeacherName}</h3>
                   <button onClick={() => setView('list')} className="btn-cancel-pro" style={{ padding: '8px 20px', fontSize: '13px' }}>
                     {t('common.backToList')}
                   </button>
                </div>
                <div className="table-academic-wrapper">
                   <table className="table-academic">
                     <thead>
                       <tr>
                         <th>{t('teacher.day')}</th>
                         <th>{t('common.date')}</th>
                         <th>{t('teacher.time')}</th>
                         <th>{t('teacher.module')}</th>
                         <th>{t('teacher.level')}</th>
                         <th>{t('teacher.type')}</th>
                         <th>{t('teacher.sectionGroup')}</th>
                         <th>SUPP</th>
                         <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                       </tr>
                     </thead>
                     <tbody>
                       {teacherSchedule.length > 0 ? teacherSchedule.map(s => (
                         <tr key={s.id}>
                           <td style={{ fontWeight: '800', color: 'var(--p-indigo)' }}>{t(`days.${s.day_of_week}`)}</td>
                           <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                             {s.session_date 
                               ? new Date(s.session_date).toLocaleDateString() 
                               : getNextOccurrence(s.day_of_week, s.start_time).toLocaleDateString()
                             }
                           </td>
                           <td>
                             {s.start_time && s.end_time 
                               ? `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`
                               : '-'}
                           </td>
                           <td style={{ fontWeight: '700' }}>{s.module_name}</td>
                           <td><span className="badge-academic">{s.study_level}</span></td>
                           <td>
                              <span className={`badge-academic ${s.session_type === 'Lecture' ? 'badge-blue' : s.session_type === 'Tutorial' ? 'badge-purple' : 'badge-gold'}`}>
                                {s.session_type === 'Lecture' ? t('sessions.lecture').toUpperCase() : s.session_type === 'Tutorial' ? t('sessions.tutorialTD').toUpperCase() : t('sessions.practicalTP').toUpperCase()}
                              </span>
                           </td>
                           <td>{s.section || s.groupe ? `${t('teacher.sec')}: ${s.section} ${t('teacher.grp')}: ${s.groupe}` : '-'}</td>
                           <td>
                             {s.is_extra ? (
                               <span className="badge-pro badge-pro-warning" style={{ fontSize: '10px', padding: '4px 10px' }}>{t('common.yes') || 'Oui'}</span>
                             ) : (
                               <span className="badge-pro badge-pro-success" style={{ fontSize: '10px', padding: '4px 10px' }}>{t('common.no') || 'Non'}</span>
                             )}
                           </td>
                           <td style={{ textAlign: 'right' }}>
                             <button onClick={() => triggerCancelSession(s.id)} className="btn-cancel-pro" style={{ padding: '6px 12px', fontSize: '11px' }}>
                               {t('common.cancel')}
                             </button>
                           </td>
                         </tr>
                       )) : (
                         <tr>
                           <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '15px' }}>
                             {t('teacher.noSessionsShort') || 'Pas de séance'}
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                </div>
              </div>
            ) : (
              <div className="card-academic">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                   <h2 className="academic-title" style={{ margin: 0 }}>{t('sidebar.teachers')}</h2>
                   <div className="mnadm-search-wrapper" style={{ width: '350px' }}>
                     <span className="search-icon">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                     </span>
                     <input 
                       type="text" 
                       className="mnadm-input"
                       placeholder={t('common.search')}
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                     />
                   </div>
                </div>

                <div className="table-academic-wrapper">
                   <table className="table-academic">
                     <thead>
                       <tr>
                         <th>{t('addEmployee.lastName')}</th>
                         <th>{t('addEmployee.firstName')}</th>
                         <th>{t('common.email')}</th>
                         <th>{t('addEmployee.academicGrade')}</th>
                         <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                       </tr>
                     </thead>
                     <tbody>
                       {users
                         .filter(u => {
                           const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                           return fullName.includes(searchTerm.toLowerCase());
                         })
                         .map(u => (
                           <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => fetchTeacherSchedule(u)}>
                             <td style={{ fontWeight: '800', color: 'var(--p-indigo)' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <div className="user-avatar-mini" style={{ width: '32px', height: '32px', fontSize: '11px', overflow: 'hidden' }}>
                                   {u.profile_image ? (
                                     <img src={`http://localhost:5000${u.profile_image}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                   ) : (
                                     <>{u.prenom[0]}{u.nom[0]}</>
                                   )}
                                 </div>
                                 {u.nom}
                               </div>
                             </td>
                           <td>{u.prenom}</td>
                           <td>{u.email}</td>
                            <td><span className="badge-academic badge-gold">{t('grades.' + (u.grade || 'Teacher'))}</span></td>
                           <td style={{ textAlign: 'right' }}>
                             <button 
                               className="btn-confirm-pro" 
                               style={{ padding: '8px 16px', fontSize: '11px' }}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 fetchTeacherSchedule(u);
                               }}
                             >
                               {t('deptHead.viewSchedule')}
                             </button>
                           </td>
                         </tr>
                       ))}
                   </tbody>
                 </table>
                </div>
              </div>
             )}
          </>
        )}

        {/* Custom Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay-academic" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
          }}>
            <div className="card-academic animate-slide-up" style={{
              width: '400px', textAlign: 'center', padding: '40px',
              borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                color: '#ef4444'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>{t('common.confirmDelete')}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
                {t('common.confirmDelete')}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-cancel-pro" 
                  style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                  onClick={() => setShowConfirmModal(false)}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  className="btn-confirm-pro" 
                  style={{ flex: 1, padding: '12px', fontSize: '14px', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                  onClick={handleCancelSession}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardDeptHead;
