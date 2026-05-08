import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';import ManageAbsences from './ManageAbsences';
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
  const [weekOffset, setWeekOffset] = useState(0);
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

  const getSessionColor = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('lecture') || t.includes('cours')) return 'linear-gradient(135deg, #60a5fa, #3b82f6)';
    if (t.includes('tutorial') || t.includes('td')) return 'linear-gradient(135deg, #a78bfa, #8b5cf6)';
    if (t.includes('practical') || t.includes('tp')) return 'linear-gradient(135deg, #34d399, #10b981)';
    return 'linear-gradient(135deg, #94a3b8, #64748b)';
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
        toast.error(t('deptHead.errorFetchTeachers'));
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
        toast.error(errorData.message || t('teacher.failedLoadDashboard'));
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
        toast.error(t('sessions.failedDelete'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    } finally {
      setShowConfirmModal(false);
      setSessionToDelete(null);
    }
  };

  const handleDeactivateSession = async () => {
    if (!sessionToDelete) return;
    try {
      const token = localStorage.getItem('token');
      
      // Calculate the end of the current week viewed in the grid
      const todayDate = new Date();
      const toAcademicIndex = (day) => (day === 6 ? 0 : day + 1);
      const currentAcademicIndex = toAcademicIndex(todayDate.getDay());
      const endOfWeekDate = new Date(todayDate);
      endOfWeekDate.setDate(todayDate.getDate() - currentAcademicIndex + (weekOffset * 7) + 6);
      const formattedEndDate = endOfWeekDate.toISOString().split('T')[0];

      const res = await fetch(`http://localhost:5000/api/sessions/${sessionToDelete}/deactivate`, { 
        method: 'PUT', 
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ end_date: formattedEndDate })
      });

      if (res.ok) {
        toast.success("Séance archivée avec succès");
        if (selectedTeacher) fetchTeacherSchedule(selectedTeacher);
      } else {
        toast.error("Erreur lors de l'archivage");
      }
    } catch (error) {
      toast.error(t('common.serverError'));
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
    { id: 'classes', label: t('classes.tabTeachers') },
    { id: 'absences', label: t('sidebar.absences'), badge: badges.absences },
    { id: 'reminders', label: t('sidebar.notifications'), badge: badges.reminders },
    { id: 'promotions', label: t('sidebar.promotions'), badge: badges.promotions },
    { id: 'documents', label: t('sidebar.documents'), badge: badges.documents },
    { id: 'evaluations', label: t('sidebar.evaluations'), badge: badges.evaluations },
    { id: 'settings', label: t('settings.title') },
  ];

  const [showAddModal, setShowAddModal] = useState(false);
  const [addSlotDay, setAddSlotDay] = useState('');
  const [addSlotTime, setAddSlotTime] = useState('');
  const [quickAddForm, setQuickAddForm] = useState({
    module_name: '',
    study_level_id: '',
    section_id: '',
    group_id: '',
    session_type: 'Lecture',
    is_extra: false
  });
  const [teacherModules, setTeacherModules] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);

  const openQuickAdd = (day, time) => {
    setAddSlotDay(day);
    setAddSlotTime(time);
    setShowAddModal(true);
  };

  useEffect(() => {
    if (showAddModal && selectedTeacher) {
      const fetchModules = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/classes/teacher-modules?teacher_id=${selectedTeacher.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setTeacherModules(await res.json());
      };
      fetchModules();
    }
  }, [showAddModal, selectedTeacher]);

  useEffect(() => {
    if (quickAddForm.study_level_id) {
      const fetchSections = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/classes/sections?study_level_id=${quickAddForm.study_level_id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setSectionsList(await res.json());
      };
      fetchSections();
    } else {
      setSectionsList([]);
    }
  }, [quickAddForm.study_level_id]);

  useEffect(() => {
    if (quickAddForm.section_id) {
      const fetchGroups = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/classes/groups?section_id=${quickAddForm.section_id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setGroupsList(await res.json());
      };
      fetchGroups();
    } else {
      setGroupsList([]);
    }
  }, [quickAddForm.section_id]);

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Calculate end time (90 mins after start)
    const [h, m] = addSlotTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0);
    d.setMinutes(d.getMinutes() + 90);
    const endTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    let calculatedSessionDate = null;
    if (quickAddForm.is_extra) {
      const todayDate = new Date();
      const baseDate = new Date(todayDate);
      
      // 1. Find the start of the week for the week currently displayed (today + offset)
      const toAcademicIndex = (day) => (day === 6 ? 0 : day + 1);
      const currentAcademicIndex = toAcademicIndex(todayDate.getDay());
      
      // Move to the Saturday of the current REAL week
      baseDate.setDate(todayDate.getDate() - currentAcademicIndex);
      
      // Apply the week offset from navigation
      baseDate.setDate(baseDate.getDate() + (weekOffset * 7));
      
      // 2. Add the day offset from the grid (addSlotDay)
      const daysJsMap = { 'Saturday': 0, 'Sunday': 1, 'Monday': 2, 'Tuesday': 3, 'Wednesday': 4, 'Thursday': 5, 'Friday': 6 };
      const targetOffset = daysJsMap[addSlotDay];
      
      baseDate.setDate(baseDate.getDate() + targetOffset);
      calculatedSessionDate = baseDate.toISOString().split('T')[0];
    }

    try {
      const res = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          teacher_id: selectedTeacher.id,
          department_id: user.department_id,
          module_name: quickAddForm.module_name,
          day_of_week: addSlotDay,
          start_time: addSlotTime,
          end_time: endTimeStr,
          session_type: quickAddForm.session_type,
          study_level_id: quickAddForm.study_level_id,
          section_id: quickAddForm.section_id,
          group_id: quickAddForm.session_type === 'Lecture' ? null : quickAddForm.group_id,
          is_extra: quickAddForm.is_extra,
          session_date: calculatedSessionDate
        })
      });

      if (res.ok) {
        toast.success(t('sessions.successAdd') || 'Séance ajoutée');
        setShowAddModal(false);
        fetchTeacherSchedule(selectedTeacher); // Refresh
      } else {
        const err = await res.json();
        toast.error(err.message || t('common.errorLoading'));
      }
    } catch (e) { toast.error(t('common.serverError')); }
  };

  const getPageTitle = () => {
    switch(view) {
      case 'list': return t('topbar.teachersDirectory');
      case 'classes': return t('classes.title');
      case 'absences': return t('topbar.absenceValidations');
      case 'promotions': return t('topbar.careerAdvancements');
      case 'documents': return t('topbar.documentsManagement');
      case 'evaluations': return t('topbar.teacherEvaluations');
      case 'settings': return t('settings.title');
      case 'reminders': return t('topbar.departmentNotifications');
      case 'teacher-schedule': return t('topbar.teacherSchedule');
      default: return t('sidebar.overview');
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
            {view === 'classes' ? <ManageClasses user={user} /> :
             view === 'absences' ? <ManageAbsences user={user} /> : 
             view === 'promotions' ? <ManagePromotions user={user} /> : 
             view === 'documents' ? <ManageDocuments user={user} /> : 
             view === 'evaluations' ? <ManageEvaluations user={user} /> : 
             view === 'reminders' ? <ManageReminders user={user} /> : 
             view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : 
             view === 'teacher-schedule' ? (            <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {selectedTeacherName}
                    {selectedTeacher?.created_at && (
                      <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', border: '1px solid #e2e8f0', textTransform: 'uppercase' }}>
                         Recruté(e) le {new Date(selectedTeacher.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('topbar.teacherSchedule')}</p>
                </div>

                {/* Week Navigator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '8px 16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <button 
                      onClick={() => {
                        const today = new Date();
                        const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                        const currentAcademicIndex = toAcademicIndex(today.getDay());
                        const start = new Date(today);
                        start.setDate(today.getDate() - currentAcademicIndex + (weekOffset * 7));
                        const refDate = new Date(2025, 8, 20);
                        if (start > refDate) setWeekOffset(prev => prev - 1);
                      }}
                      style={{ 
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', width: '36px', height: '36px', 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        opacity: (() => {
                            const today = new Date();
                            const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                            const start = new Date(today);
                            start.setDate(today.getDate() - toAcademicIndex(today.getDay()) + (weekOffset * 7));
                            return start <= new Date(2025, 8, 20) ? 0.3 : 1;
                        })(),
                        pointerEvents: (() => {
                            const today = new Date();
                            const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                            const start = new Date(today);
                            start.setDate(today.getDate() - toAcademicIndex(today.getDay()) + (weekOffset * 7));
                            return start <= new Date(2025, 8, 20) ? 'none' : 'auto';
                        })()
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    
                    <div style={{ textAlign: 'center', minWidth: '200px' }}>
                      {(() => {
                        const today = new Date();
                        const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                        const currentAcademicIndex = toAcademicIndex(today.getDay());
                        const start = new Date(today);
                        start.setDate(today.getDate() - currentAcademicIndex + (weekOffset * 7));
                        const end = new Date(start);
                        end.setDate(start.getDate() + 6);
                        
                        // Academic Year Boundaries
                        const refDate = new Date(2025, 8, 20); // Sept 20, 2025
                        const endDate = new Date(2026, 5, 27); // June 27, 2026
                        
                        const diffTime = start.getTime() - refDate.getTime();
                        const weekNum = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

                        const isFirstWeek = start <= refDate;
                        const isLastWeek = end >= endDate;

                        return (
                          <>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--p-indigo)', textTransform: 'uppercase' }}>
                              {weekOffset === 0 ? "Semaine Actuelle" : `Semaine ${weekNum}`}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                              {start.toLocaleDateString()} - {end.toLocaleDateString()}
                            </div>
                            <div style={{ display: 'none' }}>{/* Hidden flags for buttons */}
                                <span id="is-first-week">{isFirstWeek.toString()}</span>
                                <span id="is-last-week">{isLastWeek.toString()}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <button 
                      onClick={() => {
                        const today = new Date();
                        const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                        const currentAcademicIndex = toAcademicIndex(today.getDay());
                        const start = new Date(today);
                        start.setDate(today.getDate() - currentAcademicIndex + (weekOffset * 7));
                        const end = new Date(start);
                        end.setDate(start.getDate() + 6);
                        const endDate = new Date(2026, 5, 27);
                        if (end < endDate) setWeekOffset(prev => prev + 1);
                      }}
                      style={{ 
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', width: '36px', height: '36px', 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        opacity: (() => {
                            const today = new Date();
                            const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                            const start = new Date(today);
                            start.setDate(today.getDate() - toAcademicIndex(today.getDay()) + (weekOffset * 7));
                            const end = new Date(start); end.setDate(start.getDate() + 6);
                            return end >= new Date(2026, 5, 27) ? 0.3 : 1;
                        })(),
                        pointerEvents: (() => {
                            const today = new Date();
                            const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                            const start = new Date(today);
                            start.setDate(today.getDate() - toAcademicIndex(today.getDay()) + (weekOffset * 7));
                            const end = new Date(start); end.setDate(start.getDate() + 6);
                            return end >= new Date(2026, 5, 27) ? 'none' : 'auto';
                        })()
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>

                <button onClick={() => setView('list')} className="btn-cancel-pro" style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '14px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  {t('common.backToList')}
                </button>
              </div>

              <div className="schedule-grid-container" style={{ background: '#f8fafc', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                <div className="schedule-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '120px repeat(6, 1fr)', 
                  gap: '12px',
                  minWidth: '1000px'
                }}>
                  <div className="grid-header-cell" style={{ background: 'white', padding: '15px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', color: 'var(--p-indigo)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase' }}>
                    {t('common.time')}
                  </div>
                  {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => (
                    <div key={day} className="grid-header-cell" style={{ textAlign: 'center', fontWeight: '800', textTransform: 'uppercase', background: 'white', padding: '15px', borderRadius: '12px', fontSize: '13px', color: '#0f172a', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t(`days.${day}`)}
                    </div>
                  ))}

                  {(() => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    const toAcademicIndex = (d) => (d === 6 ? 0 : d + 1);
                    const currentAcademicIndex = toAcademicIndex(today.getDay());
                    
                    startOfWeek.setDate(today.getDate() - currentAcademicIndex + (weekOffset * 7));
                    startOfWeek.setHours(0, 0, 0, 0);
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);

                    const allPossibleSessions = teacherSchedule;
                    const currentWeekSchedule = allPossibleSessions.filter(s => {
                      // Check if session was created AFTER this week ended
                      const createdAt = new Date(s.created_at);
                      if (createdAt > endOfWeek) return false;

                      // Check if session ended BEFORE this week started
                      if (s.end_date) {
                        const endDate = new Date(s.end_date);
                        endDate.setHours(23, 59, 59, 999);
                        if (endDate < startOfWeek) return false;
                      }

                      if (!s.session_date) return true; // Hebdo (modèle)
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
                              onClick={() => sessionsInSlot.length === 0 && openQuickAdd(day, slot.start)}
                              style={{ 
                                minHeight: '100px',
                                background: sessionsInSlot.length === 0 ? 'rgba(255,255,255,0.4)' : 'transparent',
                                borderRadius: '16px',
                                padding: '8px',
                                position: 'relative',
                                border: '1px dashed #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                cursor: sessionsInSlot.length === 0 ? 'pointer' : 'default'
                              }}
                            >
                              {sessionsInSlot.length === 0 && (
                                <div className="add-indicator" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px', color: '#cbd5e1', opacity: 0, transition: 'all 0.2s ease', fontWeight: '300' }}>+</div>
                              )}
                              {sessionsInSlot.map(s => (
                                <div 
                                  key={s.id} 
                                  className="schedule-card animate-float"
                                  style={{ 
                                    background: getSessionColor(s.session_type),
                                    position: 'relative',
                                    flex: 1,
                                    minHeight: '110px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: '12px',
                                    borderRadius: '14px',
                                    color: 'white',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); triggerCancelSession(s.id); }}
                                    style={{ 
                                      position: 'absolute', top: '8px', right: '8px', 
                                      background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', 
                                      width: '20px', height: '20px', fontSize: '10px', 
                                      color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      zIndex: 2, backdropFilter: 'blur(4px)'
                                    }}
                                  >
                                    ✕
                                  </button>
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
                                        {t('common.extraShort')}
                                      </div>
                                    ) : null}
                                    <div style={{ fontWeight: '900', textTransform: 'uppercase', opacity: 0.9, fontSize: '9px', letterSpacing: '0.8px', marginBottom: '4px' }}>
                                      {s.session_type === 'Lecture' ? t('sessions.lecture') : 
                                       s.session_type === 'Tutorial' ? t('sessions.tutorialTD') : 
                                       s.session_type === 'Replacement' ? 'RATTRAPAGE' : 
                                       t('sessions.practicalTP')}
                                    </div>
                                    <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {s.module_name}
                                  </div>
                                  <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '600' }}>
                                    {s.section && `S: ${s.section}`} {s.groupe && `G: ${s.groupe}`}
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
            ) :              <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                   <div>
                     <h2 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('sidebar.teachers')}</h2>
                     <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{users.length} {t('deptHead.teachersInDept')}</p>
                   </div>
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
                       style={{ height: '48px', borderRadius: '14px' }}
                     />
                   </div>
                </div>

                <div className="modern-table-wrapper">
                   <table className="modern-table">
                     <thead>
                       <tr>
                         <th>{t('common.fullName')}</th>
                         <th>{t('common.grade')}</th>
                         <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                       </tr>
                     </thead>
                     <tbody>
                       {users
                         .filter(u => `${u.nom} ${u.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()))
                         .map(u => (
                           <tr key={u.id} className="table-row-animate" onClick={() => fetchTeacherSchedule(u)} style={{ cursor: 'pointer' }}>
                             <td>
                               <div className="user-profile-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <div className="avatar-circle" style={{ 
                                   width: '40px', height: '40px', borderRadius: '12px', 
                                   background: 'linear-gradient(135deg, var(--p-indigo), #6366f1)', color: 'white', 
                                   display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                   fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                 }}>
                                   {u.nom[0]}{u.prenom[0]}
                                 </div>
                                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                                   <span style={{ fontWeight: '700', color: '#0f172a' }}>{u.nom} {u.prenom}</span>
                                   <span style={{ color: '#64748b', fontSize: '12px' }}>{u.email}</span>
                                 </div>
                               </div>
                             </td>
                             <td>
                               <span className="grade-tag" style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                                 {t('grades.' + (u.grade || 'Teacher'))}
                               </span>
                             </td>
                             <td style={{ textAlign: 'center' }}>
                               <button 
                                 className="btn-confirm-pro" 
                                 style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   fetchTeacherSchedule(u);
                                 }}
                               >
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                 {t('deptHead.viewSchedule')}
                               </button>
                             </td>
                           </tr>
                         ))}
                     </tbody>
                   </table>
                </div>
              </div>
            }
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
              width: '450px', textAlign: 'center', padding: '40px',
              borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                color: '#f59e0b'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2 4-4"></path><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Gestion de la Séance</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
                Que souhaitez-vous faire avec cette séance ?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn-confirm-pro" 
                  style={{ width: '100%', padding: '14px', fontSize: '14px', backgroundColor: 'var(--p-indigo)', borderColor: 'var(--p-indigo)' }}
                  onClick={handleDeactivateSession}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M12 20v-6M9 20v-4M15 20v-2M18 20v-8M6 20v-2M3 20v-4M21 20v-6"></path><path d="M3 10l9-7 9 7"></path></svg>
                  Arrêter ce cours (Archiver pour le futur)
                </button>

                <button 
                  className="btn-confirm-pro" 
                  style={{ width: '100%', padding: '14px', fontSize: '14px', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                  onClick={handleCancelSession}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  Supprimer définitivement (Erreur de saisie)
                </button>

                <button 
                  className="btn-cancel-pro" 
                  style={{ width: '100%', padding: '14px', fontSize: '14px', marginTop: '8px' }}
                  onClick={() => setShowConfirmModal(false)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* QUICK ADD MODAL */}
        {showAddModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', 
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' 
          }}>
            <div className="card-academic" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 className="academic-title" style={{ margin: 0 }}>{t('sessions.addSession')}</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              </div>
              
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--p-indigo-light)', borderRadius: '16px', border: '1px solid var(--p-indigo-soft)', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: 'var(--p-indigo)', fontWeight: '800', marginBottom: '4px' }}>
                   {t(`days.${addSlotDay}`)} @ {addSlotTime}
                </div>
                <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.2px' }}>
                  {(() => {
                    const todayDate = new Date();
                    const baseDate = new Date(todayDate);
                    const toAcademicIndex = (day) => (day === 6 ? 0 : day + 1);
                    const currentAcademicIndex = toAcademicIndex(todayDate.getDay());
                    baseDate.setDate(todayDate.getDate() - currentAcademicIndex + (weekOffset * 7));
                    const daysJsMap = { 'Saturday': 0, 'Sunday': 1, 'Monday': 2, 'Tuesday': 3, 'Wednesday': 4, 'Thursday': 5, 'Friday': 6 };
                    baseDate.setDate(baseDate.getDate() + daysJsMap[addSlotDay]);
                    
                    const refDate = new Date(2025, 8, 6);
                    const diffTime = baseDate.getTime() - refDate.getTime();
                    const weekNum = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
                    
                    return (
                      <>
                        <span style={{ color: 'var(--p-indigo)', marginRight: '8px' }}>S{weekNum} •</span>
                        {baseDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </>
                    );
                  })()}
                </div>
              </div>

              <form onSubmit={handleQuickAddSubmit}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="mnadm-form-group" style={{ flex: 1 }}>
                    <label className="mnadm-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.studyLevel')}</label>
                    <select 
                      className="mnadm-input" 
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      value={quickAddForm.study_level_id || ''} 
                      onChange={e => setQuickAddForm({...quickAddForm, study_level_id: e.target.value, module_name: '', section_id: '', group_id: ''})}
                      required
                    >
                      <option value="">-- {t('common.select')} --</option>
                      {Array.from(new Map(teacherModules.map(m => [m.study_level_id, { id: m.study_level_id, name: m.study_level }])).values()).map(sl => (
                        <option key={sl.id} value={sl.id}>{sl.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mnadm-form-group" style={{ flex: 2 }}>
                    <label className="mnadm-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.moduleSubject')}</label>
                    <select 
                      className="mnadm-input" 
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      value={quickAddForm.module_name} 
                      onChange={e => {
                        const mod = teacherModules.find(m => m.name === e.target.value);
                        setQuickAddForm({...quickAddForm, module_name: e.target.value, study_level_id: mod?.study_level_id || quickAddForm.study_level_id});
                      }}
                      required
                      disabled={!quickAddForm.study_level_id}
                    >
                      <option value="">-- {t('common.select')} --</option>
                      {teacherModules.filter(m => String(m.study_level_id) === String(quickAddForm.study_level_id)).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="mnadm-form-group" style={{ flex: 1 }}>
                    <label className="mnadm-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>{t('teacher.type')}</label>
                    <select className="mnadm-input" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={quickAddForm.session_type} onChange={e => setQuickAddForm({...quickAddForm, session_type: e.target.value})}>
                      <option value="Lecture">{t('sessions.lecture')}</option>
                      <option value="Tutorial">{t('sessions.tutorialTD')}</option>
                      <option value="Practical">{t('sessions.practicalTP')}</option>
                    </select>
                  </div>
                  <div className="mnadm-form-group" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '32px' }}>
                    <input type="checkbox" id="is_extra_quick" checked={quickAddForm.is_extra} onChange={e => setQuickAddForm({...quickAddForm, is_extra: e.target.checked})} />
                    <label htmlFor="is_extra_quick" style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{t('common.extraShort')}</label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="mnadm-form-group" style={{ flex: 1 }}>
                    <label className="mnadm-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.section')}</label>
                    <select className="mnadm-input" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={quickAddForm.section_id} onChange={e => setQuickAddForm({...quickAddForm, section_id: e.target.value, group_id: ''})} disabled={!quickAddForm.study_level_id} required>
                      <option value="">-- {t('common.select')} --</option>
                      {sectionsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  {quickAddForm.session_type !== 'Lecture' && (
                    <div className="mnadm-form-group" style={{ flex: 1 }}>
                      <label className="mnadm-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.group')}</label>
                      <select className="mnadm-input" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={quickAddForm.group_id} onChange={e => setQuickAddForm({...quickAddForm, group_id: e.target.value})} disabled={!quickAddForm.section_id} required>
                        <option value="">-- {t('common.select')} --</option>
                        {groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-confirm-pro" style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '12px', fontWeight: '700' }}>
                  {t('sessions.scheduleSession')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardDeptHead;
