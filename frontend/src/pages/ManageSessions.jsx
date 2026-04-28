import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useLanguage } from '../i18n/LanguageContext';

function ManageSessions({ user }) {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleName, setModuleName] = useState('');
  const [studyLevel, setStudyLevel] = useState('L1');
  const [section, setSection] = useState('');
  const [groupe, setGroupe] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState(user?.department_id || null);
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [sessionType, setSessionType] = useState('Lecture');
  const { t } = useLanguage();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resSessions, resUsers] = await Promise.all([
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/users', { headers })
      ]);
      if (resSessions.ok) setSessions(await resSessions.json());
      if (resUsers.ok) { const users = await resUsers.json(); setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT')); }
    } catch (error) { toast.error(t('sessions.failedFetch')); } finally { setLoading(false); }
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const deptId = user?.department_id;
      if (!deptId) return;
      const res = await fetch(`http://localhost:5000/api/modules?department_id=${deptId}&study_level=${studyLevel}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setModules(await res.json());
    } catch (error) { console.error('Error fetching modules:', error); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchModules(); }, [studyLevel]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedDeptId) return toast.error(t('sessions.selectTeacherDept'));
    if (!moduleName) return toast.error(t('sessions.moduleSubject'));

    const loadToast = toast.loading(t('sessions.scheduling'));
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ teacher_id: selectedTeacherId, department_id: selectedDeptId, module_name: moduleName, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, session_type: sessionType, study_level: studyLevel, section, groupe }) });
      toast.dismiss(loadToast);
      if (res.ok) { toast.success(`${moduleName} — ${dayOfWeek} ${startTime}-${endTime}`); setModuleName(''); fetchData(); }
      else { const data = await res.json(); toast.error(data.message || t('sessions.errorCreation')); }
    } catch (error) { toast.dismiss(loadToast); toast.error(t('common.serverError')); }
  };

  const handleCancelSession = async (id) => {
    if (!window.confirm(t('sessions.confirmCancel'))) return;
    try { const token = localStorage.getItem('token'); const res = await fetch(`http://localhost:5000/api/sessions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { toast.success(t('sessions.cancelled')); fetchData(); } else { toast.error(t('sessions.errorCancel')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const teacherOptions = teachers.map(t2 => ({ value: t2.id, label: `${t2.nom} ${t2.prenom}` }));
  const moduleOptions = modules.map(m => ({ value: m.name, label: m.name }));

  const dayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const dayEnglish = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  return (
    <div style={{ padding: '20px' }}>
      <form onSubmit={handleCreateSession} style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.moduleSubject')}</label>
            <CreatableSelect
              isClearable
              options={moduleOptions}
              value={moduleOptions.find(o => o.value === moduleName) || (moduleName ? { value: moduleName, label: moduleName } : null)}
              onChange={(o) => setModuleName(o?.value || '')}
              placeholder={t('sessions.moduleSubject')}
              styles={{ 
                control: (base) => ({ 
                  ...base, 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  minHeight: '42px',
                  boxShadow: 'none',
                  '&:hover': { border: '1px solid #cbd5e1' }
                }),
                valueContainer: (base) => ({ ...base, padding: '0 8px' })
              }}
            />
          </div>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.studyLevel')}</label><select value={studyLevel} onChange={e => setStudyLevel(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="M1">M1</option><option value="M2">M2</option></select></div>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.section')}</label><input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A, B" style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.group')}</label><input type="text" value={groupe} onChange={e => setGroupe(e.target.value)} placeholder="e.g. 1, 2" style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.selectTeacher')}</label>
            <Select 
              options={teacherOptions} 
              value={teacherOptions.find(o => o.value === selectedTeacherId)} 
              onChange={o => {
                setSelectedTeacherId(o?.value);
                const teacher = teachers.find(t2 => t2.id === o?.value);
                if (teacher) setSelectedDeptId(teacher.department_id);
              }} 
              placeholder={t('sessions.searchTeacher')} 
              isClearable 
              isSearchable 
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.day')}</label><select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>{dayEnglish.map((d, i) => <option key={d} value={d}>{t('sessions.' + dayKeys[i])}</option>)}</select></div>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.startTime')}</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('sessions.endTime')}</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
          <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('teacher.type')}</label><select value={sessionType} onChange={e => setSessionType(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="Lecture">{t('sessions.lecture')}</option><option value="Tutorial">{t('sessions.tutorialTD')}</option><option value="Practical">{t('sessions.practicalTP')}</option></select></div>
        </div>
        <button type="submit" className="btn-submit" style={{ background: '#3b82f6' }}>{t('sessions.scheduleSession')}</button>
      </form>

      {loading ? <div className="loading-spinner">{t('sessions.loadingSchedule')}</div> : (
        <div className="table-card">
          <table className="modern-table">
            <thead><tr><th>#</th><th>{t('sessions.day')}</th><th>{t('teacher.time')}</th><th>{t('sessions.moduleSubjectCol')}</th><th>{t('teacher.level')}</th><th>{t('teacher.type')}</th><th>{t('sessions.secGrp')}</th><th>{t('common.teacher')}</th><th>{t('common.department')}</th><th>{t('common.actions')}</th></tr></thead>
            <tbody>
              {sessions.map((s, index) => (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td><strong>{s.day_of_week}</strong></td>
                  <td>{s.start_time?.substring(0,5)} - {s.end_time?.substring(0,5)}</td>
                  <td>{s.module_name}</td>
                  <td><span className="role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{s.study_level || '-'}</span></td>
                  <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{s.session_type === 'Lecture' ? t('sessions.lecture') : s.session_type === 'Tutorial' ? t('sessions.tutorialTD') : t('sessions.practicalTP')}</span></td>
                  <td>{(s.section || s.groupe) ? <span style={{ fontSize: '0.9em', color: '#666' }}>{s.section && `${s.section}`} {s.groupe && `/ ${s.groupe}`}</span> : '-'}</td>
                  <td>{s.teacher_nom} {s.teacher_prenom}</td>
                  <td>{s.department_name}</td>
                  <td><button onClick={() => handleCancelSession(s.id)} className="btn-delete">{t('common.cancel')}</button></td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan="10" className="empty-state">{t('sessions.noSessions')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageSessions;
