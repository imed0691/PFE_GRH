import React, { useState, useEffect, useRef } from 'react';
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

const getSessionColor = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('lecture') || t.includes('cours')) return 'linear-gradient(135deg, #60a5fa, #3b82f6)';
  if (t.includes('tutorial') || t.includes('td')) return 'linear-gradient(135deg, #a78bfa, #8b5cf6)';
  if (t.includes('practical') || t.includes('tp')) return 'linear-gradient(135deg, #34d399, #10b981)';
  return 'linear-gradient(135deg, #94a3b8, #64748b)';
};

function DashboardTeacher({ user, onLogout }) {
  const [stats, setStats] = useState({ 
    sessions_done: 0, 
    annual_volume_target: 192, 
    extra_sessions: 0, 
    absences: { total: 0, justified: 0, unjustified: 0 } 
  });
  const [schedule, setSchedule] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [view, setViewRaw] = useState(localStorage.getItem('teacher_dashboard_view') || 'overview');
  const [loading, setLoading] = useState(true);
  const [detailView, setDetailView] = useState(null);
  const { badges, markSeen } = useNotificationBadges();
  const { t } = useLanguage();
  const lastClearedView = useRef(null);

  const isSessionPassed = (s) => {
    const today = new Date();
    const currentHour = today.getHours() + today.getMinutes() / 60;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = today.getDay();
    const [eh, em] = (s.end_time || "00:00").split(':').map(Number);
    const sessionEndHour = eh + em/60;
    if (s.session_date) {
      const sDate = new Date(s.session_date);
      const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const sessionDateNoTime = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());
      return sessionDateNoTime < todayNoTime || (sessionDateNoTime.getTime() === todayNoTime.getTime() && sessionEndHour <= currentHour);
    } else {
      const sessionDayIndex = days.indexOf(s.day_of_week);
      return sessionDayIndex < todayIndex || (sessionDayIndex === todayIndex && sessionEndHour <= currentHour);
    }
  };

  // Expanded history logic
  const getModalData = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (detailView === 'absences') return absences;

    let history = [];
    // Align with backend: Look back to Jan 1st 2026 OR teacher creation date
    const janFirst = new Date(today.getFullYear(), 0, 1); 
    const teacherCreated = stats.teacher_created_at ? new Date(stats.teacher_created_at) : janFirst;
    const semesterStart = teacherCreated > janFirst ? teacherCreated : janFirst;

    schedule.forEach(s => {
      const isExtra = s.is_extra;
      if (detailView === 'completed' && isExtra) return;
      if (detailView === 'extra' && !isExtra) return;

      if (s.session_date) {
        // One-time session
        if (isSessionPassed(s)) history.push(s);
      } else {
        // Recurring session: Generate past occurrences since Jan 1st
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayIndex = days.indexOf(s.day_of_week);
        
        let tempDate = new Date(semesterStart);
        while (tempDate <= today) {
          if (tempDate.getDay() === targetDayIndex) {
            const occ = { ...s, session_date: tempDate.toISOString().split('T')[0] };
            if (isSessionPassed(occ)) {
              history.push(occ);
            }
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }
      }
    });

    // Sort by date descending
    return history.sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  };

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
        <>
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
                  <div 
                    className="card-academic clickable-card" 
                    onClick={() => setDetailView('completed')}
                    style={{ borderTop: '4px solid var(--p-indigo)', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                  >
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
                  <div 
                    className="card-academic clickable-card" 
                    onClick={() => setDetailView('extra')}
                    style={{ borderTop: '4px solid #f59e0b', cursor: 'pointer', transition: 'transform 0.2s' }}
                  >
                    <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      {t('teacher.extraSessions') || 'Séances Supplémentaires (SUPP)'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <p style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>{stats.extra_sessions || 0}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('teacher.extraNote') || 'Hors objectif annuel'}</p>
                    </div>
                  </div>

                  {/* ABSENCES CARD */}
                  <div 
                    className="card-academic clickable-card" 
                    onClick={() => setDetailView('absences')}
                    style={{ borderTop: '4px solid #ef4444', cursor: 'pointer', transition: 'transform 0.2s' }}
                  >
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

                <div className="schedule-grid-container" style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)', overflowX: 'auto', marginTop: '24px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-main)', fontWeight: '800' }}>
                    {t('teacher.weeklySchedule') || 'Emploi du Temps Hebdomadaire'}
                  </h3>
                  <div className="schedule-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '100px repeat(7, 1fr)', 
                    gap: '12px',
                    minWidth: '1000px'
                  }}>
                    {/* Header: Days */}
                    <div className="grid-header-cell" style={{ background: '#f8fafc', padding: '15px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Horaires
                    </div>
                    {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <div key={day} className="grid-header-cell" style={{ textAlign: 'center', fontWeight: '700', textTransform: 'capitalize', background: '#f8fafc', padding: '15px 10px', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t(`days.${day}`)}
                      </div>
                    ))}

                    {/* Time Slots & Cells */}
                    {[
                      { start: '08:00', end: '09:30' },
                      { start: '09:35', end: '11:05' },
                      { start: '11:10', end: '12:40' },
                      { start: '12:45', end: '14:15' },
                      { start: '14:20', end: '15:50' },
                      { start: '15:55', end: '17:25' }
                    ].map(slot => (
                      <div key={slot.start} style={{ display: 'contents' }}>
                        {/* Time label */}
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-muted)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRight: '1px solid #f1f5f9',
                          padding: '10px 0',
                          fontWeight: '700'
                        }}>
                          {slot.start} - {slot.end}
                        </div>

                        {/* Day cells for this slot */}
                        {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                          const sessionsInSlot = schedule.filter(s => 
                            s.day_of_week === day && 
                            s.start_time?.startsWith(slot.start)
                          );

                          return (
                            <div 
                              key={`${day}-${slot.start}`} 
                              className="grid-slot"
                              style={{ 
                                minHeight: '100px', 
                                background: '#f8fafc', 
                                borderRadius: '16px',
                                padding: '8px',
                                position: 'relative',
                                border: '1px dashed #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              {sessionsInSlot.map(session => (
                                <div 
                                  key={session.id} 
                                  className="schedule-card"
                                  style={{ 
                                    background: getSessionColor(session.session_type),
                                    position: 'relative',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    color: 'white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {session.is_extra && (
                                    <div style={{ 
                                      position: 'absolute',
                                      top: '-8px',
                                      left: '-4px',
                                      fontSize: '8px', 
                                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                                      color: '#fff', 
                                      padding: '2px 8px', 
                                      borderRadius: '6px', 
                                      fontWeight: '900', 
                                      boxShadow: '0 4px 10px rgba(217, 119, 6, 0.5)',
                                      border: '1px solid rgba(255,255,255,0.4)',
                                      zIndex: 3
                                    }}>
                                      SUPP
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <div style={{ 
                                      fontSize: '10px', 
                                      background: 'rgba(255,255,255,0.2)', 
                                      padding: '2px 6px', 
                                      borderRadius: '4px', 
                                      fontWeight: '800',
                                      textTransform: 'uppercase'
                                    }}>
                                      {session.session_type?.toLowerCase().includes('lecture') || session.session_type?.toLowerCase().includes('cours') ? 'COURS' : 
                                       session.session_type?.toLowerCase().includes('tutorial') || session.session_type?.toLowerCase().includes('td') ? 'TD' : 
                                       session.session_type?.toLowerCase().includes('practical') || session.session_type?.toLowerCase().includes('tp') ? 'TP' : 
                                       session.session_type?.toUpperCase()}
                                    </div>
                                  </div>
                                  <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {session.module_name}
                                  </div>
                                  <div style={{ fontSize: '10px', opacity: 0.8 }}>
                                    {session.section && `Sec: ${session.section}`} {session.groupe && `Grp: ${session.groupe}`}
                                  </div>
                                  <div style={{ fontSize: '10px', fontWeight: '600', opacity: 0.9 }}>
                                    {session.start_time.substring(0,5)} - {session.end_time.substring(0,5)}
                                  </div>
                                </div>
                              ))}
                            </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* DETAIL MODAL */}
          {detailView && (
            <div style={{ 
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', 
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' 
            }}>
              <div className="card-academic" style={{ 
                width: '100%', maxWidth: '700px', maxHeight: '80vh', overflow: 'hidden', 
                display: 'flex', flexDirection: 'column', position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                    {detailView === 'completed' ? t('teacher.annualVolume') : 
                     detailView === 'extra' ? t('teacher.extraSessions') : t('teacher.absences')}
                  </h3>
                  <button 
                    onClick={() => setDetailView(null)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                  >
                    ✕
                  </button>
                </div>
                
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                  {getModalData().length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {getModalData().map((item, idx) => (
                        <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                          {detailView === 'absences' ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.reason || 'Absence'}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleDateString()}</p>
                              </div>
                              <span style={{ 
                                fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '800',
                                background: item.justification_status === 'Accepted' ? '#f0fdf4' : '#fef2f2',
                                color: item.justification_status === 'Accepted' ? '#16a34a' : '#dc2626'
                              }}>
                                {item.justification_status === 'Accepted' ? t('teacher.justifiedShort') : t('teacher.unjustifiedShort')}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.module_name}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--p-indigo)' }}>
                                    {item.session_date 
                                      ? new Date(item.session_date).toLocaleDateString() 
                                      : getNextOccurrence(item.day_of_week, item.start_time).toLocaleDateString()
                                    }
                                  </span>
                                  {` • ${t(`days.${item.day_of_week}`)} • ${item.start_time?.substring(0,5)} - ${item.end_time?.substring(0,5)}`}
                                </p>
                              </div>
                              <span style={{ 
                                fontSize: '10px', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '4px', fontWeight: '800',
                                color: '#475569', border: '1px solid rgba(0,0,0,0.1)'
                              }}>
                                 {item.session_type?.toLowerCase().includes('lecture') || item.session_type?.toLowerCase().includes('cours') ? 'COURS' : 
                                 item.session_type?.toLowerCase().includes('tutorial') || item.session_type?.toLowerCase().includes('td') ? 'TD' : 
                                 item.session_type?.toLowerCase().includes('practical') || item.session_type?.toLowerCase().includes('tp') ? 'TP' : 
                                 item.session_type?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {t('teacher.noSessions')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
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
