import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

function ManageClasses() {
  const { t } = useLanguage();
  const [activeTab, setActiveTabRaw] = useState(localStorage.getItem('manage_classes_tab') || 'structure'); // 'structure' or 'teachers'
  
  const setActiveTab = (tab) => {
    setActiveTabRaw(tab);
    localStorage.setItem('manage_classes_tab', tab);
  };

  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  
  // Tab 1: Structure (Levels, Sections, Groups, Modules)
  const [levels, setLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [newLevelName, setNewLevelName] = useState('');

  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');

  const [modules, setModules] = useState([]);
  const [newModuleName, setNewModuleName] = useState('');

  // Tab 2: Teachers
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherModules, setTeacherModules] = useState([]);

  // Fetch departments on load
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setDepartments(await res.json());
      } catch (error) { toast.error(t('departments.errorFetching')); }
    };
    fetchDepartments();
  }, []);

  // Fetch Teachers when switching to tab or on load
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const users = await res.json();
          setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT'));
        }
      } catch (error) {}
    };
    fetchTeachers();
  }, []);

  // --- FETCHING DATA ---
  useEffect(() => {
    if (!selectedDeptId) { setLevels([]); setSelectedLevelId(''); return; }
    fetchLevels();
  }, [selectedDeptId]);

  const fetchLevels = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/levels?department_id=${selectedDeptId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setLevels(await res.json());
    } catch (error) {}
  };

  useEffect(() => {
    if (!selectedLevelId) { setSections([]); setModules([]); setSelectedSectionId(''); return; }
    fetchSections();
    fetchModules();
  }, [selectedLevelId]);

  const fetchSections = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/sections?study_level_id=${selectedLevelId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSections(await res.json());
    } catch (error) {}
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/modules?study_level_id=${selectedLevelId}&department_id=${selectedDeptId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setModules(await res.json());
    } catch (error) {}
  };

  useEffect(() => {
    if (!selectedSectionId) { setGroups([]); return; }
    fetchGroups();
  }, [selectedSectionId]);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/groups?section_id=${selectedSectionId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setGroups(await res.json());
    } catch (error) {}
  };

  useEffect(() => {
    if (!selectedTeacherId) { setTeacherModules([]); return; }
    fetchTeacherModules();
  }, [selectedTeacherId]);

  const fetchTeacherModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/teacher-modules?teacher_id=${selectedTeacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setTeacherModules(await res.json());
    } catch (error) {}
  };

  // --- HANDLERS ---
  const handleAddLevel = async (e) => {
    e.preventDefault();
    if (!selectedDeptId || !newLevelName) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/classes/levels', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newLevelName, department_id: selectedDeptId })
      });
      if (res.ok) { toast.success(t('classes.levelAdded')); setNewLevelName(''); fetchLevels(); }
    } catch (error) {}
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!selectedLevelId || !newSectionName) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/classes/sections', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newSectionName, study_level_id: selectedLevelId })
      });
      if (res.ok) { toast.success(t('classes.sectionAdded')); setNewSectionName(''); fetchSections(); }
    } catch (error) {}
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!selectedSectionId || !newGroupName) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/classes/groups', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newGroupName, section_id: selectedSectionId })
      });
      if (res.ok) { toast.success(t('classes.groupAdded')); setNewGroupName(''); fetchGroups(); }
    } catch (error) {}
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!selectedLevelId || !newModuleName) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/classes/modules', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newModuleName, study_level_id: selectedLevelId, department_id: selectedDeptId })
      });
      if (res.ok) { toast.success(t('classes.moduleAdded')); setNewModuleName(''); fetchModules(); }
    } catch (error) {}
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null });

  const handleDeleteClick = (type, id) => {
    setConfirmModal({ isOpen: true, type, id });
  };

  const performDelete = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/${type}/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t('classes.deleted'));
        if (type === 'levels') { fetchLevels(); setSelectedLevelId(''); }
        if (type === 'sections') { fetchSections(); setSelectedSectionId(''); }
        if (type === 'groups') fetchGroups();
        if (type === 'modules') fetchModules();
      }
    } catch (error) {}
  };

  const handleAssignModule = async (moduleId) => {
    if (!selectedTeacherId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/classes/teacher-modules', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teacher_id: selectedTeacherId, module_id: moduleId })
      });
      if (res.ok) { toast.success(t('classes.moduleAssigned')); fetchTeacherModules(); }
      else toast.error(t('classes.alreadyAssigned'));
    } catch (error) {}
  };

  const handleUnassignModule = async (moduleId) => {
    if (!selectedTeacherId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/teacher-modules?teacher_id=${selectedTeacherId}&module_id=${moduleId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast.success(t('classes.moduleUnassigned')); fetchTeacherModules(); }
    } catch (error) {}
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>
        {t('classes.title')}
      </h2>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('structure')} className={activeTab === 'structure' ? 'btn-confirm-pro' : 'btn-cancel-pro'} style={{ padding: '10px 24px', fontSize: '13px' }}>
          {t('classes.tabStructure')}
        </button>
        <button onClick={() => setActiveTab('teachers')} className={activeTab === 'teachers' ? 'btn-confirm-pro' : 'btn-cancel-pro'} style={{ padding: '10px 24px', fontSize: '13px' }}>
          {t('classes.tabTeachers')}
        </button>
      </div>

      {activeTab === 'structure' && (
        <>
          <div style={{ marginBottom: '30px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label className="mnadm-label">{t('classes.chooseDept')}</label>
            <select className="mnadm-input" value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} style={{ maxWidth: '400px' }}>
              <option value="">{t('classes.selectDept')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="grid-responsive">
            
            {/* LEVELS */}
            <div style={{ opacity: selectedDeptId ? 1 : 0.5, pointerEvents: selectedDeptId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>{t('classes.levels')}</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px' }}>
                {levels.map(l => (
                  <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: selectedLevelId == l.id ? '#eff6ff' : '#f8fafc', border: selectedLevelId == l.id ? '1px solid #bfdbfe' : '1px solid transparent', cursor: 'pointer' }} onClick={() => setSelectedLevelId(l.id)}>
                    <span>{l.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('levels', l.id); }} className="btn-delete-pro">
                      {t('common.delete')}
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddLevel} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="mnadm-input" value={newLevelName} onChange={e => setNewLevelName(e.target.value)} placeholder={t('classes.addLevelPlaceholder')} required />
                <button type="submit" className="btn-confirm-pro" style={{ padding: '8px 15px', fontSize: '12px' }}>{t('classes.addBtn')}</button>
              </form>
            </div>

            {/* MODULES (Attached to Level) */}
            <div style={{ opacity: selectedLevelId ? 1 : 0.5, pointerEvents: selectedLevelId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: 'var(--p-indigo)' }}>{t('classes.modules')}</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px' }}>
                {modules.map(m => (
                  <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: '#f8fafc' }}>
                    <span>{m.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('modules', m.id); }} className="btn-delete-pro">
                      {t('common.delete')}
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddModule} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="mnadm-input" value={newModuleName} onChange={e => setNewModuleName(e.target.value)} placeholder={t('classes.addModulePlaceholder')} required />
                <button type="submit" className="btn-confirm-pro" style={{ padding: '8px 15px', fontSize: '12px' }}>{t('classes.addBtn')}</button>
              </form>
            </div>

            {/* SECTIONS */}
            <div style={{ opacity: selectedLevelId ? 1 : 0.5, pointerEvents: selectedLevelId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>{t('classes.sections')}</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px' }}>
                {sections.map(s => (
                  <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: selectedSectionId == s.id ? '#eff6ff' : '#f8fafc', border: selectedSectionId == s.id ? '1px solid #bfdbfe' : '1px solid transparent', cursor: 'pointer' }} onClick={() => setSelectedSectionId(s.id)}>
                    <span>{s.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('sections', s.id); }} className="btn-delete-pro">
                      {t('common.delete')}
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="mnadm-input" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder={t('classes.addSectionPlaceholder')} required />
                <button type="submit" className="btn-confirm-pro" style={{ padding: '8px 15px', fontSize: '12px' }}>{t('classes.addBtn')}</button>
              </form>
            </div>

            {/* GROUPS */}
            <div style={{ opacity: selectedSectionId ? 1 : 0.5, pointerEvents: selectedSectionId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>{t('classes.groups')}</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px' }}>
                {groups.map(g => (
                  <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: '#f8fafc' }}>
                    <span>{g.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('groups', g.id); }} className="btn-delete-pro">
                      {t('common.delete')}
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="mnadm-input" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder={t('classes.addGroupPlaceholder')} required />
                <button type="submit" className="btn-confirm-pro" style={{ padding: '8px 15px', fontSize: '12px' }}>{t('classes.addBtn')}</button>
              </form>
            </div>

          </div>
        </>
      )}

      {activeTab === 'teachers' && (
        <div className="grid-responsive" style={{ gridTemplateColumns: 'minmax(250px, 300px) 1fr' }}>
          
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>{t('classes.chooseTeacher')}</h3>
            <div style={{ paddingRight: '10px' }}>
              {teachers.map(t => (
                <div key={t.id} onClick={() => setSelectedTeacherId(t.id)} style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', background: selectedTeacherId === t.id ? '#eff6ff' : '#f8fafc', border: selectedTeacherId === t.id ? '1px solid #bfdbfe' : '1px solid transparent' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{t.nom} {t.prenom}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{t.department_name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ opacity: selectedTeacherId ? 1 : 0.5, pointerEvents: selectedTeacherId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>{t('classes.assignModules')}</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
              <label className="mnadm-label">{t('classes.studyLevel')}</label>
              <select className="mnadm-input" value={selectedLevelId} onChange={e => setSelectedLevelId(e.target.value)} style={{ marginBottom: '15px' }}>
                <option value="">{t('common.all')}</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              
              {modules.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>{t('classes.availableModules')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {modules.map(m => {
                      const isAssigned = teacherModules.some(tm => tm.id === m.id);
                      return (
                        <button key={m.id} onClick={() => isAssigned ? handleUnassignModule(m.id) : handleAssignModule(m.id)} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: isAssigned ? 'var(--p-indigo)' : '#e2e8f0', color: isAssigned ? 'white' : '#475569', fontWeight: '600' }}>
                          {isAssigned ? '✓ ' : '+ '} {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1e293b' }}>{t('classes.taughtModules')}</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teacherModules.map(tm => (
                <li key={tm.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f1f5f9', marginBottom: '8px', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{tm.name}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '13px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>{tm.study_level}</span>
                  </div>
                  <button onClick={() => handleUnassignModule(tm.id)} className="btn-delete-pro" style={{ padding: '6px 12px', fontSize: '11px' }}>{t('common.delete')}</button>
                </li>
              ))}
              {teacherModules.length === 0 && <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>{t('classes.noModulesAssigned')}</li>}
            </ul>

          </div>

        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        message={t('classes.confirmDelete')}
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageClasses;
