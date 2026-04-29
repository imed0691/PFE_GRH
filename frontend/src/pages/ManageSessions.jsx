import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

function ManageSessions({ user }) {
  const [teachers, setTeachers] = useState([]);
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
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessionType, setSessionType] = useState('Lecture');
  const { t } = useLanguage();

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

  useEffect(() => { fetchTeachers(); }, []);

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
                group_id: groupId 
            }) 
        });
      toast.dismiss(loadToast);
      if (res.ok) { 
        toast.success(`${moduleName} — ${dayOfWeek} ${startTime}-${endTime}`); 
        setModuleName(''); 
        setStudyLevelId('');
        setSectionId('');
        setGroupId('');
        setStartTime('');
        setEndTime('');
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

  return (
    <div style={{ padding: '20px' }}>
      <form onSubmit={handleCreateSession} style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
        
        {/* NEW FLOW: Teacher first, then Module */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.teacher')}</label>
            <Select
              isLoading={loading}
              isClearable
              options={teachers.map(t => ({ value: t.id, label: `${t.nom} ${t.prenom}` }))}
              value={teachers.filter(t => t.id === selectedTeacherId).map(t => ({ value: t.id, label: `${t.nom} ${t.prenom}` }))[0] || null}
              onChange={(o) => setSelectedTeacherId(o ? o.value : null)}
              placeholder={t('sessions.selectTeacher')}
              styles={{ control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '42px' }) }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.moduleSubject')}</label>
            <Select
              isClearable
              isDisabled={!selectedTeacherId}
              options={moduleOptions}
              value={moduleOptions.find(o => o.value === moduleName) || null}
              onChange={handleModuleChange}
              placeholder={!selectedTeacherId ? t('sessions.selectTeacherFirst') : t('sessions.moduleSubject')}
              styles={{ control: (base) => ({ ...base, borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '42px' }) }}
            />
          </div>
        </div>

        {/* Level automatically determined, select Section and Group */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.section')}</label><select value={sectionId} onChange={e => { setSectionId(e.target.value); setGroupId(''); }} disabled={!studyLevelId} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: !studyLevelId ? '#f1f5f9' : 'white' }}><option value="">-- {t('common.search')} --</option>{sectionsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.group')}</label><select value={groupId} onChange={e => setGroupId(e.target.value)} disabled={!sectionId} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: !sectionId ? '#f1f5f9' : 'white' }}><option value="">-- {t('common.search')} --</option>{groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '15px' }}>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.sessionType')}</label><select value={sessionType} onChange={e => setSessionType(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="Lecture">{t('sessions.lecture')}</option><option value="Tutorial">{t('sessions.tutorial')}</option><option value="Practical">{t('sessions.practical')}</option></select></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.day')}</label><select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (<option key={day} value={day}>{t(`days.${day}`)}</option>))}</select></div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.startTime')}</label>
            <select value={startTime} onChange={handleTimeChange} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required>
              <option value="">-- {t('common.search')} --</option>
              <option value="08:00">08:00</option>
              <option value="09:35">09:35</option>
              <option value="11:10">11:10</option>
              <option value="12:45">12:45</option>
              <option value="14:20">14:20</option>
              <option value="15:55">15:55</option>
            </select>
          </div>
        </div>

        <button type="submit" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', width: '100%', fontSize: '15px' }}>{t('sessions.create')}</button>
      </form>
    </div>
  );
}

export default ManageSessions;
