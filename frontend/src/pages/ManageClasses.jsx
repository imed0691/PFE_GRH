import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

function ManageClasses({ user }) {
  const { t } = useLanguage();
  // Role-based view selection (no state needed for tabs)


  const [activeTab, setActiveTab] = useState('structure');
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(user.role === 'RH_MANAGER' ? '' : user.department_id);
  
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
  const [teacherSearch, setTeacherSearch] = useState('');

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
  }, [selectedDeptId]);

  // --- FETCHING DATA ---
  useEffect(() => {
    // Reset downstream selections when dept changes
    setSelectedLevelId('');
    setSelectedSectionId('');
    
    if (!selectedDeptId) { setLevels([]); return; }
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
    // Reset downstream selections when level changes
    setSelectedSectionId('');
    
    if (!selectedLevelId) { setSections([]); setModules([]); return; }
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

  // Filter teachers to only show those in the selected department AND match search
  const filteredTeachers = teachers.filter(t => {
    // For Dept Head, strictly match their department. For HR Manager, match selected or show all if none selected.
    const isDeptHead = user.role === 'CHEF_DEPARTEMENT' || user.role === 'DEPARTMENT_HEAD';
    const matchesDept = isDeptHead 
      ? t.department_id === parseInt(selectedDeptId)
      : (!selectedDeptId || t.department_id === parseInt(selectedDeptId));
      
    const fullName = `${t.nom} ${t.prenom}`.toLowerCase();
    const matchesSearch = fullName.includes(teacherSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

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
      else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || t('classes.alreadyAssigned'));
      }
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

      {/* Direct role-based rendering (no tabs needed) */}
      {user.role === 'RH_MANAGER' && (
        <>
          {/* PREMIUM HEADER AREA */}
          <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* PREMIUM SUB-TABS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div 
                className={`card-academic ${activeTab === 'structure' ? 'active-tab-card' : ''}`} 
                onClick={() => setActiveTab('structure')}
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '20px 24px',
                  border: activeTab === 'structure' ? '2px solid var(--p-indigo)' : '1px solid var(--border-soft)',
                  background: activeTab === 'structure' ? '#f5f7ff' : 'white',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ padding: '10px', background: activeTab === 'structure' ? 'var(--p-indigo)' : '#f1f5f9', color: activeTab === 'structure' ? 'white' : '#64748b', borderRadius: '12px', transition: 'all 0.3s ease' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: activeTab === 'structure' ? 'var(--p-indigo)' : '#1e293b' }}>{t('classes.tabStructure')}</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{t('classes.tabStructureSubtitle')}</p>
                </div>
              </div>

              <div 
                className={`card-academic ${activeTab === 'modules' ? 'active-tab-card' : ''}`} 
                onClick={() => setActiveTab('modules')}
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '20px 24px',
                  border: activeTab === 'modules' ? '2px solid var(--p-indigo)' : '1px solid var(--border-soft)',
                  background: activeTab === 'modules' ? '#f5f7ff' : 'white',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ padding: '10px', background: activeTab === 'modules' ? 'var(--p-indigo)' : '#f1f5f9', color: activeTab === 'modules' ? 'white' : '#64748b', borderRadius: '12px', transition: 'all 0.3s ease' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: activeTab === 'modules' ? 'var(--p-indigo)' : '#1e293b' }}>{t('classes.tabModules')}</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{t('classes.tabModulesSubtitle')}</p>
                </div>
              </div>
            </div>

            {/* DEPT SELECTION CARD */}
            <div className="card-academic" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', width: 'fit-content', minWidth: '400px', maxWidth: '100%' }}>
              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '16px', color: 'var(--p-indigo)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div style={{ flex: 1 }}>
                <label className="mnadm-label" style={{ marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('classes.chooseDept')}</label>
                <select className="mnadm-input" value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} style={{ fontWeight: '800', border: 'none', background: '#f8fafc', padding: '10px 14px', width: '100%', minWidth: '250px' }}>
                  <option value="">{t('classes.selectDept')}</option>
                  {departments.map(d => {
                    const translated = t('departments.' + d.name);
                    return (
                      <option key={d.id} value={d.id}>
                        {translated.includes('.') ? d.name : translated}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

          </div>

          <div className="explorer-container" style={{ gridTemplateColumns: activeTab === 'modules' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
            
            {/* COLUMN 1: LEVELS (Universal) */}
            <div className={`explorer-column ${!selectedDeptId ? 'disabled' : ''}`}>
              <div className="explorer-header">
                <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> {t('classes.levels')}</h3>
              </div>
              <div className="explorer-list">
                {!selectedDeptId ? (
                  <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>{t('classes.selectDeptFirst')}</div>
                ) : levels.map(l => (
                  <div key={l.id} className={`explorer-item ${selectedLevelId == l.id ? 'active' : ''}`} onClick={() => setSelectedLevelId(l.id)}>
                    <strong>{l.name}</strong>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('levels', l.id); }} className="btn-delete-pro" style={{ padding: '4px 8px', fontSize: '10px' }}>
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
              <div className="explorer-footer">
                <form onSubmit={handleAddLevel} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                  <input type="text" className="mnadm-input" value={newLevelName} onChange={e => setNewLevelName(e.target.value)} placeholder={t('classes.addLevelPlaceholder')} style={{ fontSize: '13px', padding: '12px 12px 12px 36px' }} required disabled={!selectedDeptId} />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </span>
                  <button type="submit" className="btn-confirm-pro" style={{ padding: '0 16px', height: '42px', borderRadius: '12px' }} disabled={!selectedDeptId}>{t('classes.addBtn')}</button>
                </form>
              </div>
            </div>

            {(!activeTab || activeTab === 'structure') ? (
              <>
                {/* COLUMN 2: SECTIONS */}
                <div className={`explorer-column ${!selectedLevelId ? 'disabled' : ''}`}>
                  <div className="explorer-header">
                    <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg> {t('classes.sections')}</h3>
                  </div>
                  <div className="explorer-list">
                    {!selectedLevelId ? (
                      <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>{t('classes.selectLevelFirst')}</div>
                    ) : sections.map(s => (
                      <div key={s.id} className={`explorer-item ${selectedSectionId == s.id ? 'active' : ''}`} onClick={() => setSelectedSectionId(s.id)}>
                        <strong>{s.name}</strong>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('sections', s.id); }} className="btn-delete-pro" style={{ padding: '4px 8px', fontSize: '10px' }}>
                          {t('common.delete')}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="explorer-footer">
                    <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                      <input type="text" className="mnadm-input" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder={t('classes.addSectionPlaceholder')} style={{ fontSize: '13px', padding: '12px 12px 12px 36px' }} required disabled={!selectedLevelId} />
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </span>
                      <button type="submit" className="btn-confirm-pro" style={{ padding: '0 16px', height: '42px', borderRadius: '12px' }} disabled={!selectedLevelId}>{t('classes.addBtn')}</button>
                    </form>
                  </div>
                </div>

                {/* COLUMN 3: GROUPS */}
                <div className={`explorer-column ${!selectedSectionId ? 'disabled' : ''}`}>
                  <div className="explorer-header">
                    <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> {t('classes.groups')}</h3>
                  </div>
                  <div className="explorer-list">
                    {!selectedSectionId ? (
                      <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>{t('classes.selectSectionFirst')}</div>
                    ) : groups.map(g => (
                      <div key={g.id} className="explorer-item">
                        <strong>{g.name}</strong>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('groups', g.id); }} className="btn-delete-pro" style={{ padding: '4px 8px', fontSize: '10px' }}>
                          {t('common.delete')}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="explorer-footer">
                    <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                      <input type="text" className="mnadm-input" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder={t('classes.addGroupPlaceholder')} style={{ fontSize: '13px', padding: '12px 12px 12px 36px' }} required disabled={!selectedSectionId} />
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </span>
                      <button type="submit" className="btn-confirm-pro" style={{ padding: '0 16px', height: '42px', borderRadius: '12px' }} disabled={!selectedSectionId}>{t('classes.addBtn')}</button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              /* COLUMN 2: MODULES (CURRICULUM VIEW) */
              <div className={`explorer-column ${!selectedLevelId ? 'disabled' : ''}`} style={{ flex: '2' }}>
                <div className="explorer-header">
                  <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> {t('classes.modules')}</h3>
                </div>
                <div className="explorer-list">
                  {!selectedLevelId ? (
                    <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>{t('classes.selectLevelFirst')}</div>
                  ) : modules.map(m => (
                    <div key={m.id} className="explorer-item">
                      <strong>{m.name}</strong>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('modules', m.id); }} className="btn-delete-pro" style={{ padding: '4px 8px', fontSize: '10px' }}>
                        {t('common.delete')}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="explorer-footer">
                  <form onSubmit={handleAddModule} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                    <input type="text" className="mnadm-input" value={newModuleName} onChange={e => setNewModuleName(e.target.value)} placeholder={t('classes.addModulePlaceholder')} style={{ fontSize: '13px', padding: '12px 12px 12px 36px' }} required disabled={!selectedLevelId} />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </span>
                    <button type="submit" className="btn-confirm-pro" style={{ padding: '0 16px', height: '42px', borderRadius: '12px' }} disabled={!selectedLevelId}>{t('classes.addBtn')}</button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </>
      )}


      {(user.role === 'CHEF_DEPARTEMENT' || user.role === 'DEPARTMENT_HEAD') && (
        <div className="grid-responsive" style={{ gridTemplateColumns: 'minmax(250px, 300px) 1fr' }}>
          
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>{t('classes.chooseTeacher')}</h3>
            
            {/* Search Bar for Teachers */}
            <div className="mnadm-search-wrapper" style={{ marginBottom: '15px' }}>
              <span className="search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input 
                type="text" 
                className="mnadm-input" 
                placeholder={t('common.search') || 'Rechercher...'} 
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                style={{ fontSize: '13px', padding: '8px 12px 8px 35px' }}
              />
            </div>

            <div style={{ paddingRight: '10px', maxHeight: '500px', overflowY: 'auto' }}>
              {filteredTeachers.map(t => (
                <div key={t.id} onClick={() => setSelectedTeacherId(t.id)} style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', background: selectedTeacherId === t.id ? '#eff6ff' : '#f8fafc', border: selectedTeacherId === t.id ? '1px solid #bfdbfe' : '1px solid transparent' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{t.nom} {t.prenom}</div>
                  <div style={{ fontSize: '12px', color: 'var(--p-gold)', fontWeight: '700' }}>{t('grades.' + (t.grade || 'Teacher'))}</div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ margin: 0, fontWeight: '600' }}>{t('classes.availableModules')}</label>
                    <input 
                      type="text" 
                      placeholder={t('common.search')} 
                      className="mnadm-input" 
                      style={{ maxWidth: '180px', padding: '4px 10px', fontSize: '12px', height: '30px' }}
                      onChange={(e) => {
                        const term = e.target.value.toLowerCase();
                        const container = e.target.parentElement.nextSibling;
                        const buttons = container.querySelectorAll('button');
                        buttons.forEach(btn => {
                          const text = btn.textContent.toLowerCase();
                          btn.style.display = text.includes(term) ? 'inline-block' : 'none';
                        });
                      }}
                    />
                  </div>
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
