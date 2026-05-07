import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import './DashboardHR.css';

function ManageSessions() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [filterTeacherDeptId, setFilterTeacherDeptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  
  const [formData, setFormData] = useState({
    module_name: '',
    session_type: 'Lecture',
    study_level: 'L1',
    teacher_id: '',
    department_id: '',
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '10:00',
    section: '',
    groupe: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resSessions, resUsers, resDepts] = await Promise.all([
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/departments', { headers })
      ]);

      if (resSessions.ok && resUsers.ok && resDepts.ok) {
        setSessions(await resSessions.json());
        setDepartments(await resDepts.json());
        
        const allUsers = await resUsers.json();
        setTeachers(allUsers.filter(u => u.role.toUpperCase() === 'TEACHER' || u.role.toUpperCase() === 'ENSEIGNANT'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  let filteredTeachers = teachers;
  if (filterTeacherDeptId) {
    filteredTeachers = teachers.filter(t => t.department_id === parseInt(filterTeacherDeptId));
  }
  const teacherOptions = filteredTeachers.map(t => ({ value: t.id, label: `${t.nom} ${t.prenom} (${t.department_name || 'No Dept'})` }));
  
  const handleTeacherChange = (selectedOption) => {
    setFormData({ ...formData, teacher_id: selectedOption ? selectedOption.value : '' });
  };

  const deptOptions = departments.map(d => ({ value: d.id, label: t('departments.' + d.name).includes('.') ? d.name : t('departments.' + d.name) }));
  const handleDeptChange = (selectedOption) => {
    setFormData({ ...formData, department_id: selectedOption ? selectedOption.value : '' });
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.department_id) {
      toast.error(t('sessions.selectTeacherDept') || "Veuillez sélectionner un enseignant et un département");
      return;
    }

    const token = localStorage.getItem('token');
    const loadToast = toast.loading(t('common.loading'));

    try {
      const res = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      toast.dismiss(loadToast);

      if (res.ok) {
        toast.success(t('sessions.successAdd') || 'Session planifiée');
        setFormData({ ...formData, module_name: '', section: '', groupe: '' });
        fetchData();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error(t('common.serverError'));
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const performDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(t('sessions.successCancel') || 'Session annulée');
        fetchData();
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    }
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      padding: '4px',
      borderRadius: '14px',
      borderColor: '#e2e8f0',
      background: '#f8fafc',
      boxShadow: 'none',
      '&:hover': { borderColor: 'var(--p-indigo)' }
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? 'var(--p-indigo)' : isFocused ? '#f1f5f9' : 'white',
      color: isSelected ? 'white' : '#1e293b',
      fontSize: '14px'
    })
  };

  return (
    <div className="animate-mnadm">
      {/* Session Creation Card */}
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-amber)', padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ background: '#fffbeb', color: '#d97706', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div>
            <h3 className="serif" style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>{t('sessions.newSession')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('sessions.newSessionDesc')}</p>
          </div>
        </div>

        <form onSubmit={handleAddSession}>
          <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.moduleName')}</label>
              <input type="text" name="module_name" className="mnadm-input" value={formData.module_name} onChange={handleChange} required placeholder="e.g. Mathématiques" style={{ borderRadius: '12px', fontWeight: '700' }} />
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.studyLevel')}</label>
              <select name="study_level" className="mnadm-input" value={formData.study_level} onChange={handleChange} style={{ borderRadius: '12px', fontWeight: '700' }}>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
              </select>
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.type')}</label>
              <select name="session_type" className="mnadm-input" value={formData.session_type} onChange={handleChange} style={{ borderRadius: '12px', fontWeight: '700' }}>
                <option value="Lecture">Lecture (Cours)</option>
                <option value="Tutorial">Tutorial (TD)</option>
                <option value="Practical">Practical (TP)</option>
              </select>
            </div>
          </div>

          <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.section')}</label>
              <input type="text" name="section" className="mnadm-input" value={formData.section} onChange={handleChange} required placeholder="e.g. A" style={{ borderRadius: '12px', fontWeight: '700' }} />
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.group') || 'Groupe'}</label>
              <input 
                type="text" 
                name="groupe" 
                className="mnadm-input" 
                value={formData.groupe} 
                onChange={handleChange} 
                placeholder="e.g. G1" 
                disabled={!(formData.session_type === 'Tutorial' || formData.session_type === 'Practical')}
                style={{ borderRadius: '12px', fontWeight: '700' }} 
              />
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.day') || 'Jour'}</label>
              <select name="day_of_week" className="mnadm-input" value={formData.day_of_week} onChange={handleChange} style={{ borderRadius: '12px', fontWeight: '700' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day}>{t('days.' + day) || day}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '24px', marginBottom: '24px' }}>
             <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.filterDept') || 'Filtrer Dept'}</label>
              <select className="mnadm-input" value={filterTeacherDeptId} onChange={(e) => { setFilterTeacherDeptId(e.target.value); setFormData({...formData, teacher_id: ''}); }} style={{ borderRadius: '12px', fontWeight: '700' }}>
                <option value="">{t('common.all')}</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{t('departments.' + d.name).includes('.') ? d.name : t('departments.' + d.name)}</option>
                ))}
              </select>
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.teacher') || 'Enseignant'}</label>
              <Select
                options={teacherOptions}
                onChange={handleTeacherChange}
                placeholder="-- Rechercher --"
                isClearable
                isSearchable
                value={teacherOptions.find(o => o.value === formData.teacher_id) || null}
                styles={selectStyles}
              />
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.department') || 'Département (Affectation)'}</label>
              <Select
                options={deptOptions}
                onChange={handleDeptChange}
                placeholder="-- Rechercher --"
                isClearable
                isSearchable
                value={deptOptions.find(o => o.value === formData.department_id) || null}
                styles={selectStyles}
              />
            </div>
          </div>

          <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.startTime') || 'Heure début'}</label>
              <input type="time" name="start_time" className="mnadm-input" value={formData.start_time} onChange={handleChange} required style={{ borderRadius: '12px', fontWeight: '800' }} />
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label">{t('sessions.endTime') || 'Heure fin'}</label>
              <input type="time" name="end_time" className="mnadm-input" value={formData.end_time} onChange={handleChange} required style={{ borderRadius: '12px', fontWeight: '800' }} />
            </div>
            <div className="mnadm-form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
               <button type="submit" className="btn-confirm-pro" style={{ width: '100%', height: '48px', borderRadius: '14px', fontWeight: '800', fontSize: '15px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                {t('sessions.addBtn') || 'PLANIFIER LA SÉANCE'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sessions List Card */}
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="serif" style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>{t('sessions.listTitle') || 'Emploi du Temps Global'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{sessions.length} {t('sessions.countLabel') || 'séances planifiées au total'}</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ padding: '60px' }}>{t('common.loadingData')}</div>
        ) : (
          <div className="modern-table-wrapper" style={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>{t('sessions.day') || 'Jour'}</th>
                  <th style={{ width: '140px' }}>{t('sessions.time') || 'Horaire'}</th>
                  <th style={{ width: '110px' }}>{t('common.date') || 'Date'}</th>
                  <th>{t('sessions.module') || 'Module'}</th>
                  <th style={{ width: '100px' }}>{t('sessions.level') || 'Niveau'}</th>
                  <th style={{ width: '120px' }}>{t('sessions.type') || 'Type'}</th>
                  <th style={{ width: '120px' }}>{t('sessions.secGrp') || 'Sec/Grp'}</th>
                  <th>{t('sessions.teacher') || 'Enseignant'}</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} className="table-row-animate">
                    <td><div style={{ fontWeight: '800', color: 'var(--p-indigo)', textTransform: 'capitalize' }}>{t('days.' + s.day_of_week) || s.day_of_week}</div></td>
                    <td><div style={{ fontWeight: '700', color: '#1e293b', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', display: 'inline-block', fontSize: '13px' }}>{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</div></td>
                    <td><div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{s.session_date ? new Date(s.session_date).toLocaleDateString() : '---'}</div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{s.module_name}</div>
                        {s.is_extra === 1 && <span className="badge-pro" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', fontSize: '10px', padding: '2px 6px' }}>SUPP</span>}
                      </div>
                    </td>
                    <td><span className="badge-pro badge-pro-info" style={{ fontWeight: '800', borderRadius: '8px' }}>{s.study_level}</span></td>
                    <td><span style={{ fontWeight: '700', fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>{s.session_type}</span></td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
                        {s.section && <span style={{ marginRight: '8px' }}>S: {s.section}</span>}
                        {s.groupe && <span>G: {s.groupe}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{s.teacher_nom} {s.teacher_prenom}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button className="btn-delete-pro" onClick={() => handleDeleteClick(s.id)} style={{ padding: '8px', borderRadius: '10px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan="8" className="empty-state-cell" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('sessions.empty') || 'Aucune séance planifiée'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={t('common.confirmation')}
        message={t('sessions.confirmCancel') || 'Voulez-vous vraiment annuler cette séance ?'}
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageSessions;
