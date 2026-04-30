import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageAbsences from './ManageAbsences';
import ReminderInbox from './ReminderInbox';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import useNotificationBadges from '../hooks/useNotificationBadges';
import Settings from './Settings';
import { getNextOccurrence, formatShortDate } from '../utils/dateUtils';
import './DashboardTeacher.css';

function DashboardTeacher({ user, onLogout }) {
  const [stats, setStats] = useState({ teaching_hours: 0, total_absences: 0 });
  const [schedule, setSchedule] = useState([]);
  const [view, setViewRaw] = useState(localStorage.getItem('teacher_dashboard_view') || 'overview');
  const [loading, setLoading] = useState(true);
  const { badges, markSeen } = useNotificationBadges();
  const { t } = useLanguage();
  const lastClearedView = useRef(null);

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => { 
    setViewRaw(newView); 
    localStorage.setItem('teacher_dashboard_view', newView);
    if (badges[newView] && badges[newView] > 0) markSeen(newView); 
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/teacher/dashboard/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[DEBUG] Teacher Data:', data);
        if (data.academic_stats) {
          setStats(data.academic_stats);
        }
        setSchedule(data.all_sessions || []);
      }
    } catch (e) { toast.error(t('teacher.failedLoadDashboard')); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchDashboardData(); 
  }, []);

  useEffect(() => {
    if (view !== lastClearedView.current && badges[view] > 0) {
      markSeen(view);
      lastClearedView.current = view;
    }
  }, [view, badges[view]]);

  const menuItems = [
    { id: 'overview', label: t('sidebar.mySchedule') || 'My Schedule' },
    { id: 'absences', label: t('sidebar.absences'), badge: badges.absences },
    { id: 'reminders', label: t('sidebar.reminders'), badge: badges.reminders },
    { id: 'promotions', label: t('sidebar.promotions'), badge: badges.promotions },
    { id: 'documents', label: t('sidebar.documents'), badge: badges.documents },
    { id: 'evaluations', label: t('sidebar.evaluations'), badge: badges.evaluations },
    { id: 'settings', label: t('settings.title') },
  ];

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={setView}
      menuItems={menuItems}
      onLogout={onLogout}
      title={view === 'overview' ? 'Academic Workspace' : getPageTitle()}
    >
      <div className="animate-float">
        {view === 'absences' ? <ManageAbsences user={user} /> : 
         view === 'reminders' ? <ReminderInbox user={user} /> : 
         view === 'promotions' ? <ManagePromotions user={user} /> :
         view === 'documents' ? <ManageDocuments user={user} /> :
         view === 'evaluations' ? <ManageEvaluations user={user} /> :
         view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
           <div className="teacher-view animate-mnadm">
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div className="card-academic">
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('teacher.sessionsToDo') || 'Sessions to do'}</h4>
                  <p style={{ fontSize: '32px', fontWeight: '800', color: 'var(--p-indigo)' }}>{stats.total_weekly_sessions || 0}</p>
                </div>
                <div className="card-academic">
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('teacher.sessionsDone') || 'Sessions Done'}</h4>
                  <p style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{stats.completed_sessions || 0}</p>
                </div>
                <div className="card-academic">
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('teacher.absences') || 'Absences'}</h4>
                  <p style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444' }}>{stats.absences || 0}</p>
                </div>
                <div className="card-academic">
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('teacher.extraSessions') || 'Extra Sessions'}</h4>
                  <p style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b' }}>{stats.extra_sessions || 0}</p>
                </div>
              </div>

              <div className="card-academic">
                <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>{t('teacher.weeklySchedule')}</h3>
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
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.length > 0 ? schedule.map(s => (
                        <tr key={s.id}>
                          <td>
                            <span className="day-badge-pro">{t(`days.${s.day_of_week}`)}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            {s.session_date 
                              ? new Date(s.session_date).toLocaleDateString() 
                              : getNextOccurrence(s.day_of_week, s.start_time).toLocaleDateString()
                            }
                          </td>
                          <td className="time-text-pro">
                            {s.start_time && s.end_time 
                              ? `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`
                              : '-'}
                          </td>
                          <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>{s.module_name}</td>
                          <td>{s.study_level}</td>
                          <td>
                            <span className={`session-type-pro type-${s.session_type?.toLowerCase() || 'other'}`}>
                              {s.session_type === 'Lecture' ? 'COURS' : 
                               s.session_type === 'Tutorial' ? 'TD' : 
                               s.session_type === 'Practical' ? 'TP' : s.session_type}
                            </span>
                            {s.is_extra ? (
                              <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: '#fff7ed', color: '#c2410c', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fdba74' }}>
                                EXTRA
                              </span>
                            ) : null}
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {s.section || s.groupe ? `${t('teacher.sec')}: ${s.section} ${t('teacher.grp')}: ${s.groupe}` : '-'}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>{t('teacher.noSessions')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
         )}
      </div>
    </DashboardLayout>
  );
}

const getPageTitle = () => 'Dashboard'; // Helper function if needed

export default DashboardTeacher;
