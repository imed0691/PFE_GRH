import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageAbsences from './ManageAbsences';
import ReminderInbox from './ReminderInbox';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import MySalary from './MySalary';
import useNotificationBadges from '../hooks/useNotificationBadges';
import Settings from './Settings';
import { getNextOccurrence, formatShortDate } from '../utils/dateUtils';
import './DashboardTeacher.css';

function DashboardTeacher({ user, onLogout }) {
  const [stats, setStats] = useState({ 
    sessions_done: 0, 
    annual_volume_target: 0, 
    extra_sessions: 0, 
    absences: { total: 0, justified: 0, unjustified: 0 } 
  });
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
    { id: 'salary', label: t('sidebar.salary') || 'Mon Salaire' },
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
      title={getPageTitle(view, t)}
    >
      <div className="animate-float">
        {view === 'absences' ? <ManageAbsences user={user} /> : 
         view === 'reminders' ? <ReminderInbox user={user} /> : 
         view === 'promotions' ? <ManagePromotions user={user} /> :
         view === 'salary' ? <MySalary user={user} /> :
         view === 'documents' ? <ManageDocuments user={user} /> :
         view === 'evaluations' ? <ManageEvaluations user={user} /> :
         view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
           <div className="teacher-view animate-mnadm">
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                
                {/* PROGRESS CARD */}
                <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', position: 'relative', overflow: 'hidden' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {t('teacher.annualVolume') || 'Objectif Annuel'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--p-indigo)' }}>{stats.sessions_done || 0}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>/ {stats.annual_volume_target || 0} {t('teacher.sessions') || 'séances'}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, ((stats.sessions_done || 0) / (stats.annual_volume_target || 1)) * 100)}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--p-indigo), #818cf8)',
                      borderRadius: '4px',
                      transition: 'width 1s ease-out'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontWeight: '500' }}>
                    {Math.round(((stats.sessions_done || 0) / (stats.annual_volume_target || 1)) * 100)}% {t('teacher.completed') || 'complété'}
                  </p>
                </div>

                {/* EXTRA SESSIONS */}
                <div className="card-academic" style={{ borderTop: '4px solid #f59e0b' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {t('teacher.extraSessions') || 'Séances Supplémentaires (SUPP)'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>{stats.extra_sessions || 0}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('teacher.extraNote') || 'Hors objectif annuel'}</p>
                  </div>
                </div>

                {/* ABSENCES CARD */}
                <div className="card-academic" style={{ borderTop: '4px solid #ef4444' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {t('teacher.absences') || 'État des Absences'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '32px', fontWeight: '900', color: '#ef4444', lineHeight: 1 }}>{stats.absences?.total || 0}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Total des absences</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', borderRadius: '20px', fontWeight: '700' }}>
                        {stats.absences?.justified || 0} {t('teacher.justifiedShort') || 'Justifiées'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '4px 10px', background: '#fef2f2', color: '#dc2626', borderRadius: '20px', fontWeight: '700' }}>
                        {stats.absences?.unjustified || 0} {t('teacher.unjustifiedShort') || 'Non-justifiées'}
                      </div>
                    </div>
                  </div>
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
                              {s.session_type === 'Lecture' ? t('sessions.lecture').toUpperCase() : 
                               s.session_type === 'Tutorial' ? t('sessions.tutorialTD').toUpperCase() : 
                               s.session_type === 'Practical' ? t('sessions.practicalTP').toUpperCase() : s.session_type}
                            </span>
                            {s.is_extra ? (
                              <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: '#fff7ed', color: '#c2410c', fontSize: '10px', fontWeight: 'bold', border: '1px solid #fdba74' }}>
                                {t('sessions.extraBadge')}
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

const getPageTitle = (view, t) => {
  switch(view) {
    case 'overview': return t('sidebar.mySchedule');
    case 'absences': return t('sidebar.absences');
    case 'reminders': return t('sidebar.reminders');
    case 'promotions': return t('sidebar.promotions');
    case 'salary': return t('sidebar.salary') || 'Mon Salaire';
    case 'documents': return t('sidebar.documents');
    case 'evaluations': return t('sidebar.evaluations');
    case 'settings': return t('settings.title');
    default: return 'Dashboard';
  }
};

export default DashboardTeacher;
