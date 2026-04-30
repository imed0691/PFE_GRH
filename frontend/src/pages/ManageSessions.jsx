import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

function ManageSessions({ user }) {
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selections
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [moduleName, setModuleName] = useState('');
  const [studyLevelId, setStudyLevelId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [groupId, setGroupId] = useState('');
  
  // Lists
  const [teacherModules, setTeacherModules] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  
  const [selectedDeptId, setSelectedDeptId] = useState(user?.department_id || null);
   const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [sessionDate, setSessionDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessionType, setSessionType] = useState('Lecture');
  const [isExtra, setIsExtra] = useState(false);
  const { t } = useLanguage();

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/sessions', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSessions(await res.json());
    } catch (error) { console.error('Error fetching sessions:', error); }
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { 
        const users = await res.json(); 
        setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT')); 
      }
    } catch (error) { toast.error(t('sessions.failedFetch')); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchTeachers(); 
    fetchSessions();
  }, []);

  // Fetch Teacher Modules when Teacher changes
  useEffect(() => {
    if (!selectedTeacherId) { 
        setTeacherModules([]); 
        setModuleName(''); 
        setStudyLevelId(''); 
        return; 
    }
    const fetchTeacherModules = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/teacher-modules?teacher_id=${selectedTeacherId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTeacherModules(await res.json());
    };
    fetchTeacherModules();
  }, [selectedTeacherId]);

  // When Module is selected, we automatically get the Study Level ID
  const handleModuleChange = (selectedOption) => {
    if (!selectedOption) {
        setModuleName('');
        setStudyLevelId('');
        setSectionId('');
        setGroupId('');
        return;
    }
    setModuleName(selectedOption.value);
    setStudyLevelId(selectedOption.studyLevelId);
    setSectionId('');
    setGroupId('');
  };

  // Fetch Sections when Study Level changes (indirectly from Module selection)
  useEffect(() => {
    if (!studyLevelId) { setSectionsList([]); return; }
    const fetchSections = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/sections?study_level_id=${studyLevelId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSectionsList(await res.json());
    };
    fetchSections();
  }, [studyLevelId]);

  // Fetch Groups when Section changes
  useEffect(() => {
    if (!sectionId) { setGroupsList([]); return; }
    const fetchGroups = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/groups?section_id=${sectionId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGroupsList(await res.json());
    };
    fetchGroups();
  }, [sectionId]);

  // Transform teacher modules into options for react-select
  const moduleOptions = teacherModules.map(m => ({ 
      value: m.name, 
      label: `${m.name} (${m.study_level})`,
      studyLevelId: m.study_level_id 
  }));

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedDeptId) return toast.error(t('sessions.selectTeacherDept'));
    if (!moduleName) return toast.error(t('sessions.moduleSubject'));

    const loadToast = toast.loading(t('sessions.scheduling'));
    try { 
        const token = localStorage.getItem('token'); 
        const res = await fetch('http://localhost:5000/api/sessions', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
            body: JSON.stringify({ 
                teacher_id: selectedTeacherId, 
                department_id: selectedDeptId, 
                module_name: moduleName, 
                day_of_week: dayOfWeek, 
                start_time: startTime, 
                end_time: endTime, 
                session_type: sessionType, 
                study_level_id: studyLevelId, 
                section_id: sectionId, 
                group_id: groupId,
                is_extra: !isRecurring, // Automatic logic: One-time = Extra
                session_date: isRecurring ? null : (sessionDate || null)
            }) 
        });
      toast.dismiss(loadToast);
      if (res.ok) { 
        toast.success(`${moduleName} - ${dayOfWeek} ${startTime}-${endTime}`); 
        setModuleName(''); 
        setStudyLevelId('');
        setSectionId('');
        setGroupId('');
        setStartTime('');
        setEndTime('');
        setSessionDate('');
        setIsRecurring(true);
        fetchSessions();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || t('sessions.failedCreate'));
      }
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error(t('sessions.failedCreate'));
    }
  };

  const handleTimeChange = (e) => {
    const selectedStartTime = e.target.value;
    setStartTime(selectedStartTime);
    
    if (selectedStartTime) {
      const [hours, minutes] = selectedStartTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0);
      date.setMinutes(date.getMinutes() + 90);
      const endHours = String(date.getHours()).padStart(2, '0');
      const endMins = String(date.getMinutes()).padStart(2, '0');
      setEndTime(`${endHours}:${endMins}`);
    } else {
      setEndTime('');
    }
  };

  const handleDateChange = (e) => {
    const dateVal = e.target.value;
    setSessionDate(dateVal);
    if (dateVal) {
      const d = new Date(dateVal);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDay = dayNames[d.getDay()];
      if (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'].includes(selectedDay)) {
        setDayOfWeek(selectedDay);
      }
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="table-card" style={{ marginBottom: '30px' }}>
        <div className="card-header">
          <h3>{t('sessions.scheduleSession')}</h3>
          <p>{t('sessions.subtitle') || 'Create and manage academic schedules'}</p>
        </div>
        <form onSubmit={handleCreateSession} className="card-academic" style={{ marginBottom: '32px' }}>
          <div className="mnadm-form-row">
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('common.teacher')}</label>
              <Select
                isLoading={loading}
                isClearable
                options={teachers.map(t => ({ value: t.id, label: `${t.nom} ${t.prenom}` }))}
                value={teachers.filter(t => t.id === selectedTeacherId).map(t => ({ value: t.id, label: `${t.nom} ${t.prenom}` }))[0] || null}
                onChange={(o) => setSelectedTeacherId(o ? o.value : null)}
                placeholder={t('sessions.selectTeacher')}
                styles={{ control: (base) => ({ ...base, borderRadius: '12px', padding: '4px', border: '1px solid #e2e8f0', fontSize: '14px' }) }}
              />
            </div>
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('sessions.moduleSubject')}</label>
              <Select
                isClearable
                isDisabled={!selectedTeacherId}
                options={moduleOptions}
                value={moduleOptions.find(o => o.value === moduleName) || null}
                onChange={handleModuleChange}
                placeholder={!selectedTeacherId ? t('sessions.chooseTeacherFirst') : t('sessions.moduleSubject')}
                styles={{ control: (base) => ({ ...base, borderRadius: '12px', padding: '4px', border: '1px solid #e2e8f0', fontSize: '14px' }) }}
              />
            </div>
          </div>

          <div className="mnadm-form-row">
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('sessions.section')}</label>
              <select className="mnadm-input" value={sectionId} onChange={e => { setSectionId(e.target.value); setGroupId(''); }} disabled={!studyLevelId}>
                <option value="">-- {t('common.select')} --</option>
                {sectionsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('sessions.group')}</label>
              <select className="mnadm-input" value={groupId} onChange={e => setGroupId(e.target.value)} disabled={!sectionId}>
                <option value="">-- {t('common.select')} --</option>
                {groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('teacher.type')}</label>
              <select className="mnadm-input" value={sessionType} onChange={e => setSessionType(e.target.value)}>
                <option value="Lecture">{t('sessions.lecture')}</option>
                <option value="Tutorial">{t('sessions.tutorialTD')}</option>
                <option value="Practical">{t('sessions.practicalTP')}</option>
              </select>
            </div>
          </div>

          <div className="mnadm-form-row" style={{ marginBottom: '24px' }}>
             <div className="mnadm-form-group" style={{ flex: 'none', width: 'auto' }}>
                <div 
                  onClick={() => setIsRecurring(!isRecurring)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    background: isRecurring ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                    border: isRecurring ? '2px solid #10b981' : '2px solid var(--p-indigo)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: isRecurring ? '#10b981' : 'var(--p-indigo)',
                    boxShadow: isRecurring ? '0 0 10px rgba(16, 185, 129, 0.4)' : '0 0 10px rgba(99, 102, 241, 0.4)'
                  }} />
                  {isRecurring ? t('sessions.weekly') : t('sessions.once')}
                </div>
             </div>
          </div>

          <div className="mnadm-form-row">
            {!isRecurring ? (
              <div className="mnadm-form-group">
                <label className="mnadm-label">{t('common.date')}</label>
                <input 
                  type="date" 
                  className="mnadm-input" 
                  value={sessionDate} 
                  onChange={handleDateChange} 
                  min={new Date().toISOString().split('T')[0]}
                  required={!isRecurring}
                />
              </div>
            ) : (
              <div className="mnadm-form-group">
                <label className="mnadm-label">{t('sessions.day')}</label>
                <select className="mnadm-input" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} required={isRecurring}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'].map(day => (
                    <option key={day} value={day}>{t(`days.${day}`)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('sessions.startTime')}</label>
              <select className="mnadm-input" value={startTime} onChange={handleTimeChange} required>
                <option value="">{t('common.search')}...</option>
                <option value="08:00">08:00 ({t('sessions.ends')}: 09:30)</option>
                <option value="09:35">09:35 ({t('sessions.ends')}: 11:05)</option>
                <option value="11:10">11:10 ({t('sessions.ends')}: 12:40)</option>
                <option value="12:45">12:45 ({t('sessions.ends')}: 14:15)</option>
                <option value="14:20">14:20 ({t('sessions.ends')}: 15:50)</option>
                <option value="15:55">15:55 ({t('sessions.ends')}: 17:25)</option>
              </select>
            </div>
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('sessions.endTime')}</label>
              <input type="text" className="mnadm-input" value={endTime} readOnly style={{ backgroundColor: '#f8fafc' }} />
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '14px' }}>{t('sessions.scheduleSession')}</button>
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="card-header">
          <h3>{t('sessions.activeSchedule')}</h3>
        </div>
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>{t('sessions.day')}</th>
                <th>{t('teacher.time')}</th>
                <th>{t('sessions.moduleSubjectCol')}</th>
                <th>{t('teacher.level')}</th>
                <th>{t('teacher.type')}</th>
                <th>{t('sessions.secGrp')}</th>
                <th>{t('common.teacher')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions?.map(s => (
                <tr key={s.id}>
                  <td><strong>{t(`days.${s.day_of_week}`)}</strong></td>
                  <td>{s.start_time?.substring(0,5)} - {s.end_time?.substring(0,5)}</td>
                  <td>{s.module_name}</td>
                  <td><span className="role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{s.study_level || '-'}</span></td>
                  <td><span className="role-tag" style={{ background: '#f1f5f9', color: '#475569' }}>{s.session_type === 'Lecture' ? t('sessions.lecture') : s.session_type === 'Tutorial' ? t('sessions.tutorialTD') : t('sessions.practicalTP')}</span></td>
                  <td>{(s.section || s.groupe) ? <span style={{ fontSize: '13px', color: '#64748b' }}>{s.section && `${s.section}`} {s.groupe && `/ ${s.groupe}`}</span> : '-'}</td>
                  <td>{s.teacher_nom} {s.teacher_prenom}</td>
                  <td><button onClick={() => handleCancelSession(s.id)} className="btn-cancel-pro" style={{ padding: '6px 12px', fontSize: '11px' }}>{t('common.cancel')}</button></td>
                </tr>
              ))}
              {(!sessions || sessions.length === 0) && <tr><td colSpan="8" className="empty-state-cell">{t('sessions.noSessions')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageSessions;
