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
  if (t.includes('replacement')) return 'linear-gradient(135deg, #fb7185, #e11d48)';
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
    const janFirst = new Date(today.getFullYear(), 0, 1); 
    const teacherCreated = stats.teacher_created_at ? new Date(stats.teacher_created_at) : janFirst;
    teacherCreated.setHours(0,0,0,0);

    // Helper to check if a session at a specific date/time was marked as an absence (of any kind)
    const isAbsence = (sessionId, dateStr, startTime) => {
      return absences.some(a => {
        const aTime = a.start_time ? a.start_time.substring(0, 5) : null;
        const sTime = startTime ? startTime.substring(0, 5) : null;
        
        // Match by teacher, date and time
        return Number(a.teacher_id) === Number(user.id) &&
               a.date === dateStr &&
               (aTime === sTime || !aTime);
      });
    };

    schedule.forEach(s => {
      const isExtra = s.is_extra;
      if (detailView === 'completed' && isExtra) return;
      if (detailView === 'extra' && !isExtra) return;

      if (s.session_date) {
        // One-time session
        const d = new Date(s.session_date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        if (detailView === 'extra') {
          const isCurrentMonth = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
          if (!isCurrentMonth) return;
        }

        if (isSessionPassed(s) && !isAbsence(s.id, dateStr, s.start_time)) {
          history.push(s);
        }
      } else {
        if (isExtra) return; 
        
        let sessionCreatedAt = s.created_at ? new Date(s.created_at) : teacherCreated;
        const dayS = sessionCreatedAt.getDay();
        const daysSinceSat = (dayS + 1) % 7;
        sessionCreatedAt.setDate(sessionCreatedAt.getDate() - daysSinceSat);
        sessionCreatedAt.setHours(0,0,0,0);

        let sessionActualStart = teacherCreated > sessionCreatedAt ? teacherCreated : sessionCreatedAt;
        if (janFirst > sessionActualStart) sessionActualStart = janFirst;

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayIndex = days.indexOf(s.day_of_week);
        
        let tempDate = new Date(sessionActualStart);
        tempDate.setHours(0,0,0,0);
        while (tempDate <= today) {
          if (tempDate.getDay() === targetDayIndex) {
            const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
            const occ = { ...s, session_date: dateStr };
            if (isSessionPassed(occ) && !isAbsence(s.id, dateStr, s.start_time)) {
              history.push(occ);
            }
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }
      }
    });

    // Sort by date descending
    return history.sort((a, b) => new Date(b.session_date || b.created_at) - new Date(a.session_date || a.created_at));
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
        setAbsences(data.my_absences || []);
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
    { id: 'overview', label: t('sidebar.mySchedule') },
    { id: 'absences', label: t('sidebar.absences'), badge: badges.absences },
    { id: 'reminders', label: t('sidebar.reminders'), badge: badges.reminders },
    { id: 'promotions', label: t('sidebar.promotions'), badge: badges.promotions },
    { id: 'salary', label: t('sidebar.salary') },
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
      <div className="dashboard-content-pro animate-mnadm">
        <>
          {view === 'absences' ? <ManageAbsences user={user} /> : 
           view === 'reminders' ? <ReminderInbox user={user} /> : 
           view === 'promotions' ? <ManagePromotions user={user} /> :
           view === 'salary' ? <MySalary user={user} /> :
           view === 'documents' ? <ManageDocuments user={user} /> :
           view === 'evaluations' ? <ManageEvaluations user={user} /> :
           view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
             <div className="teacher-view">
                <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                  
                  {/* PROGRESS CARD */}
                  <div 
                    className="card-academic clickable-card" 
                    onClick={() => setDetailView('completed')}
                    style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ background: 'var(--p-indigo-light)', padding: '12px', borderRadius: '14px', color: 'var(--p-indigo)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      </div>
                      <span className="badge-pro badge-pro-info" style={{ fontSize: '10px' }}>{Math.round(((stats.sessions_done || 0) / (stats.annual_volume_target || 1)) * 100)}%</span>
                    </div>
                    <h4 className="serif" style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('teacher.annualVolume') || 'Objectif Annuel'}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a' }}>{stats.sessions_done || 0}</span>
                      <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '16px' }}>/ {stats.annual_volume_target || 0}</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, ((stats.sessions_done || 0) / (stats.annual_volume_target || 1)) * 100)}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--p-indigo), #818cf8)',
                        borderRadius: '10px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}></div>
                    </div>
                  </div>

                  {/* EXTRA SESSIONS */}
                  <div 
                    className="card-academic clickable-card" 
                    onClick={() => setDetailView('extra')}
                    style={{ borderTop: '4px solid #f59e0b', padding: '32px' }}
                  >
                    <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '14px', color: '#f59e0b', width: 'fit-content', marginBottom: '20px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    </div>
                    <h4 className="serif" style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('teacher.extraSessions') || 'Séances SUPP'}
                    </h4>
                    <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginTop: '12px', marginBottom: '8px' }}>{stats.extra_sessions || 0}</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>{t('teacher.extraNote') || 'Hors objectif annuel'}</p>
                  </div>

                  {/* ABSENCES CARD */}
                  <div 
                    className="card-academic clickable-card" 
                    onClick={() => setDetailView('absences')}
                    style={{ borderTop: '4px solid #ef4444', padding: '32px' }}
                  >
                    <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '14px', color: '#ef4444', width: 'fit-content', marginBottom: '20px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <h4 className="serif" style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('teacher.absences') || 'Absences'}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
                      <p style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a' }}>{stats.absences?.total || 0}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="badge-pro badge-pro-success" style={{ padding: '4px 10px', fontSize: '9px' }}>{stats.absences?.justified || 0} {t('teacher.justified')}</span>
                        <span className="badge-pro badge-pro-danger" style={{ padding: '4px 10px', fontSize: '9px' }}>{stats.absences?.unjustified || 0} {t('teacher.unjustified')}</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                      <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('teacher.weeklySchedule')}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('topbar.myCurrentSchedule')}</p>
                    </div>
                  </div>
                  
                  <div className="schedule-grid-container" style={{ background: '#f8fafc', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <div className="schedule-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '120px repeat(6, 1fr)', 
                      gap: '12px',
                      minWidth: '1000px'
                    }}>
                      {/* Header: Days */}
                      <div className="grid-header-cell" style={{ background: 'white', padding: '15px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', color: 'var(--p-indigo)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                        {t('common.time') || 'Horaires'}
                      </div>
                      {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => (
                        <div key={day} className="grid-header-cell" style={{ textAlign: 'center', fontWeight: '800', textTransform: 'uppercase', background: 'white', padding: '15px', borderRadius: '12px', fontSize: '13px', color: '#0f172a', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {t(`days.${day}`)}
                        </div>
                      ))}

                      {/* Time Slots & Cells */}
                      {(() => {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const currentJsDay = today.getDay();
                        const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                        const currentAcademicIndex = toAcademicIndex(currentJsDay);
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - currentAcademicIndex);
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        endOfWeek.setHours(23, 59, 59, 999);

                        const allPossibleSessions = schedule;
                        const currentWeekSchedule = allPossibleSessions.filter(s => {
                          if (!s.is_extra && !s.is_catchup) return true;
                          if (!s.session_date) return false;
                          const sDate = new Date(s.session_date);
                          return sDate >= startOfWeek && sDate <= endOfWeek;
                        });

                        return [
                          { start: '08:00', end: '09:30' },
                          { start: '09:35', end: '11:05' },
                          { start: '11:10', end: '12:40' },
                          { start: '12:45', end: '14:15' },
                          { start: '14:20', end: '15:50' },
                          { start: '15:55', end: '17:25' }
                        ].map(slot => (
                          <div key={slot.start} style={{ display: 'contents' }}>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#64748b', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: 'white',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              padding: '10px',
                              fontWeight: '700'
                            }}>
                              {slot.start} - {slot.end}
                            </div>
                            {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => {
                              const sessionsInSlot = currentWeekSchedule.filter(s => 
                                s.day_of_week === day && 
                                s.start_time?.startsWith(slot.start)
                              );
                              return (
                                <div 
                                  key={`${day}-${slot.start}`} 
                                  style={{ 
                                    minHeight: '100px',
                                    background: sessionsInSlot.length === 0 ? 'rgba(255,255,255,0.4)' : 'transparent',
                                    borderRadius: '16px',
                                    padding: '8px',
                                    position: 'relative',
                                    border: '1px dashed #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                  }}
                                >
                                  {sessionsInSlot.map(s => (
                                    <div 
                                      key={s.id} 
                                      className="schedule-card animate-float"
                                      style={{ 
                                        background: getSessionColor(s.session_type),
                                        position: 'relative',
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        padding: '12px',
                                        borderRadius: '14px',
                                        color: 'white',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      {s.is_catchup ? (
                                        <div style={{ 
                                          position: 'absolute',
                                          top: '-8px',
                                          left: '-4px',
                                          fontSize: '8px', 
                                          background: 'linear-gradient(135deg, #e11d48, #be123c)', 
                                          color: 'white', 
                                          padding: '2px 8px', 
                                          borderRadius: '6px', 
                                          fontWeight: '900', 
                                          boxShadow: '0 4px 10px rgba(225, 29, 72, 0.5)',
                                          border: '1px solid rgba(255,255,255,0.4)',
                                          zIndex: 3,
                                          letterSpacing: '0.5px'
                                        }}>
                                          RATTRAPAGE
                                        </div>
                                      ) : s.is_extra ? (
                                        <div style={{ 
                                          position: 'absolute',
                                          top: '-8px',
                                          left: '-4px',
                                          fontSize: '8px', 
                                          background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                                          color: 'white', 
                                          padding: '2px 8px', 
                                          borderRadius: '6px', 
                                          fontWeight: '900', 
                                          boxShadow: '0 4px 10px rgba(217, 119, 6, 0.5)',
                                          border: '1px solid rgba(255,255,255,0.4)',
                                          zIndex: 3,
                                          letterSpacing: '0.5px'
                                        }}>
                                          SUPP
                                        </div>
                                      ) : null}
                                      <div style={{ fontWeight: '900', textTransform: 'uppercase', opacity: 0.9, fontSize: '9px', letterSpacing: '0.8px', marginBottom: '4px' }}>
                                        {s.is_catchup ? 'RATTRAPAGE' : (s.session_type === 'Lecture' ? t('sessions.lecture') : s.session_type === 'Tutorial' ? t('sessions.tutorialTD') : t('sessions.practicalTP'))}
                                      </div>
                                      <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {s.module_name}
                                    </div>
                                    <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '600' }}>
                                      {s.section && `S: ${s.section}`} {s.groupe && `G: ${s.groupe}`}
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.9, marginTop: '4px' }}>
                                      {s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ));
                      })()}
                    </div>
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
                              <div style={{ position: 'relative' }}>
                                {item.is_extra === 1 && (
                                  <span style={{ 
                                    fontSize: '9px', background: '#f59e0b', color: 'white', 
                                    padding: '1px 5px', borderRadius: '4px', fontWeight: '900',
                                    marginRight: '8px', verticalAlign: 'middle'
                                  }}>{t('common.extraShort') || 'SUPP'}</span>
                                )}
                                <p style={{ fontWeight: '700', color: 'var(--text-main)', display: 'inline-block' }}>{item.reason || 'Absence'}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {new Date(item.date).toLocaleDateString()}
                                  {item.start_time && ` • ${item.start_time.substring(0,5)}`}
                                </p>
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
