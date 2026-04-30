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
    // Only persist main menu views, not sub-views like teacher-schedule
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
        setViewRaw('teacher-schedule'); // Use setViewRaw to avoid persisting this sub-view
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
                      <th>{t('teacher.time')}</th>
                      <th>{t('teacher.module')}</th>
                      <th>{t('teacher.level')}</th>
                      <th>{t('teacher.type')}</th>
                      <th>{t('teacher.sectionGroup')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherSchedule.length > 0 ? teacherSchedule.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '800', color: 'var(--p-indigo)' }}>{s.day_of_week}</td>
                        <td>{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</td>
                        <td style={{ fontWeight: '700' }}>{s.module_name}</td>
                        <td><span className="badge-academic">{s.study_level}</span></td>
                        <td><span className="badge-academic badge-gold">{s.session_type}</span></td>
                        <td>{s.section || s.groupe ? `${t('teacher.sec')}: ${s.section} ${t('teacher.grp')}: ${s.groupe}` : '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                          {t('teacher.noSessions') || 'No scheduled sessions found for this teacher.'}
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
                          <td><span className="badge-academic badge-gold">{u.grade || 'Teacher'}</span></td>
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
      </div>
    </DashboardLayout>
  );
}

export default DashboardDeptHead;
