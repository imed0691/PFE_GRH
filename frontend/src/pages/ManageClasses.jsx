import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import './ManageClasses.css';

function ManageClasses({ user }) {
  const { t } = useLanguage();
  // Role-based view selection (no state needed for tabs)


  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isHR = user.role === 'HR_MANAGER' || user.role === 'RH_MANAGER';

  const [activeTab, setActiveTab] = useState(isDeptHead ? 'teachers' : 'structure');
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(isHR ? '' : user.department_id);
  
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
    <div className="animate-mnadm">
      {/* Header Section */}
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{t('classes.title') || 'Gestion des Classes'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '4px 0 0 0', fontWeight: '500' }}>{t('classes.subtitle') || 'Organisez la structure académique et gérez les attributions.'}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', background: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
            {!isDeptHead && (
              <>
                <button 
                  onClick={() => setActiveTab('structure')}
                  style={{ 
                    padding: '10px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                    background: activeTab === 'structure' ? 'white' : 'transparent',
                    color: activeTab === 'structure' ? 'var(--p-indigo)' : '#64748b',
                    boxShadow: activeTab === 'structure' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t('classes.tabStructure') || 'MANAGE CLASSES'}
                </button>
                <button 
                  onClick={() => setActiveTab('curriculum')}
                  style={{ 
                    padding: '10px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                    background: activeTab === 'curriculum' ? 'white' : 'transparent',
                    color: activeTab === 'curriculum' ? 'var(--p-indigo)' : '#64748b',
                    boxShadow: activeTab === 'curriculum' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t('classes.tabModules') || 'CURRICULUM'}
                </button>
              </>
            )}
            {!isHR && (
              <button 
                onClick={() => setActiveTab('teachers')}
                style={{ 
                  padding: '10px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                  background: activeTab === 'teachers' ? 'white' : 'transparent',
                  color: activeTab === 'teachers' ? 'var(--p-indigo)' : '#64748b',
                  boxShadow: activeTab === 'teachers' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('classes.teacherAssignments') || 'ATTRIBUTIONS'}
              </button>
            )}
          </div>
        </div>

        {(user.role === 'RH_MANAGER' || user.role === 'ADMIN') && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <label className="mnadm-label" style={{ marginBottom: '12px' }}>{t('addEmployee.department')}</label>
            <select 
              className="mnadm-input" 
              value={selectedDeptId} 
              onChange={e => setSelectedDeptId(e.target.value)}
              style={{ maxWidth: '400px', borderRadius: '14px', fontWeight: '800', background: '#f8fafc' }}
            >
              <option value="">{t('addEmployee.selectDepartment')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{t('departments.' + d.name).includes('.') ? d.name : t('departments.' + d.name)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'structure' && (
        <div className="card-academic" style={{ padding: '32px', minHeight: '600px' }}>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            
            {/* COLUMN 1: LEVELS */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                </div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{t('classes.levels')}</h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                {levels.length === 0 ? (
                  <div style={{ padding: '40px 20px', color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>{selectedDeptId ? (t('classes.noLevels') || 'Aucun niveau défini') : (t('classes.selectDeptFirst') || 'Veuillez sélectionner un département.')}</div>
                ) : levels.map(l => (
                  <div 
                    key={l.id} 
                    onClick={() => setSelectedLevelId(l.id)}
                    style={{ 
                      padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease',
                      background: selectedLevelId == l.id ? 'white' : 'transparent',
                      border: selectedLevelId == l.id ? '2px solid var(--p-indigo)' : '1px solid transparent',
                      boxShadow: selectedLevelId == l.id ? '0 10px 15px -3px rgba(0,0,0,0.04)' : 'none',
                    }}
                  >
                    <span style={{ fontWeight: '800', color: selectedLevelId == l.id ? 'var(--p-indigo)' : '#475569' }}>{l.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('levels', l.id); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
                
                <form onSubmit={handleAddLevel} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" className="mnadm-input" value={newLevelName} 
                    onChange={e => setNewLevelName(e.target.value)} 
                    placeholder={t('classes.addLevelPlaceholder')} 
                    style={{ borderRadius: '12px', fontSize: '13px', background: 'white' }} 
                    required 
                    disabled={!selectedDeptId}
                  />
                  <button type="submit" className="btn-confirm-pro" style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={!selectedDeptId}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </form>
              </div>
            </div>

            {/* COLUMN 2: SECTIONS & GROUPS */}
            <div style={{ flex: 2, minWidth: '400px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* SECTIONS */}
                <div>
                  <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{t('classes.sections')}</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '20px', border: '1px solid #e2e8f0', opacity: selectedLevelId ? 1 : 0.5 }}>
                    {!selectedLevelId ? (
                      <div style={{ padding: '40px 20px', color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>{t('classes.selectLevelFirst')}</div>
                    ) : (
                      <>
                        {sections.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => setSelectedSectionId(s.id)}
                            style={{ 
                              padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease',
                              background: selectedSectionId == s.id ? 'white' : 'transparent',
                              border: selectedSectionId == s.id ? '2px solid var(--p-indigo)' : '1px solid transparent',
                              boxShadow: selectedSectionId == s.id ? '0 10px 15px -3px rgba(0,0,0,0.04)' : 'none',
                            }}
                          >
                            <span style={{ fontWeight: '800', color: selectedSectionId == s.id ? 'var(--p-indigo)' : '#475569' }}>{s.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('sections', s.id); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                          </div>
                        ))}
                        <form onSubmit={handleAddSection} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <input type="text" className="mnadm-input" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder={t('classes.addSectionPlaceholder')} style={{ borderRadius: '12px', fontSize: '13px', background: 'white' }} required />
                          <button type="submit" className="btn-confirm-pro" style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>

                {/* GROUPS */}
                <div>
                  <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{t('classes.groups')}</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '20px', border: '1px solid #e2e8f0', opacity: selectedSectionId ? 1 : 0.5 }}>
                    {!selectedSectionId ? (
                      <div style={{ padding: '40px 20px', color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>{t('classes.selectSectionFirst')}</div>
                    ) : (
                      <>
                        {groups.map(g => (
                          <div 
                            key={g.id} 
                            style={{ 
                              padding: '14px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease',
                              background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                          >
                            <span style={{ fontWeight: '800', color: '#475569' }}>{g.name}</span>
                            <button onClick={() => handleDeleteClick('groups', g.id)} style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                          </div>
                        ))}
                        <form onSubmit={handleAddGroup} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <input type="text" className="mnadm-input" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder={t('classes.addGroupPlaceholder')} style={{ borderRadius: '12px', fontSize: '13px', background: 'white' }} required />
                          <button type="submit" className="btn-confirm-pro" style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="card-academic" style={{ padding: '32px', minHeight: '600px' }}>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {/* COLUMN 1: LEVELS (Shared) */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                </div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{t('classes.levels')}</h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                {levels.length === 0 ? (
                  <div style={{ padding: '40px 20px', color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>{selectedDeptId ? (t('classes.noLevels') || 'Aucun niveau défini') : (t('classes.selectDeptFirst') || 'Veuillez sélectionner un département.')}</div>
                ) : levels.map(l => (
                  <div 
                    key={l.id} 
                    onClick={() => setSelectedLevelId(l.id)}
                    style={{ 
                      padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease',
                      background: selectedLevelId == l.id ? 'white' : 'transparent',
                      border: selectedLevelId == l.id ? '2px solid var(--p-indigo)' : '1px solid transparent',
                      boxShadow: selectedLevelId == l.id ? '0 10px 15px -3px rgba(0,0,0,0.04)' : 'none',
                    }}
                  >
                    <span style={{ fontWeight: '800', color: selectedLevelId == l.id ? 'var(--p-indigo)' : '#475569' }}>{l.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('levels', l.id); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: MODULES */}
            <div style={{ flex: 2, minWidth: '400px' }}>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{t('classes.modules')}</h4>
              </div>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', opacity: selectedLevelId ? 1 : 0.5 }}>
                {!selectedLevelId ? (
                  <div style={{ padding: '40px 20px', color: '#94a3b8', textAlign: 'center', fontSize: '14px' }}>{t('classes.selectLevelFirst')}</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {modules.map(m => (
                        <div 
                          key={m.id} 
                          style={{ 
                            padding: '16px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                          }}
                        >
                          <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{m.name}</span>
                          <button onClick={() => handleDeleteClick('modules', m.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddModule} style={{ marginTop: '24px', display: 'flex', gap: '12px', maxWidth: '400px' }}>
                      <input type="text" className="mnadm-input" value={newModuleName} onChange={e => setNewModuleName(e.target.value)} placeholder={t('classes.addModulePlaceholder')} style={{ borderRadius: '14px', fontSize: '13px', background: 'white' }} required />
                      <button type="submit" className="btn-confirm-pro" style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teachers' && (user.role !== 'RH_MANAGER' && user.role !== 'HR_MANAGER') && (
        <div className="animate-mnadm" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
          {/* Left Column: Teacher List */}
          <div className="card-academic" style={{ padding: '24px', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h4 className="serif" style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>{t('classes.chooseTeacher') || 'Enseignants'}</h4>
            
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input 
                type="text" className="mnadm-input" placeholder={t('common.search')} value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '14px', background: '#f8fafc', fontSize: '13px' }}
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
              {filteredTeachers.map(prof => (
                <div 
                  key={prof.id} 
                  onClick={() => setSelectedTeacherId(prof.id)}
                  style={{ 
                    padding: '16px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s ease',
                    background: selectedTeacherId == prof.id ? 'var(--p-indigo-light)' : 'white',
                    border: selectedTeacherId == prof.id ? '1px solid var(--p-indigo)' : '1px solid #f1f5f9',
                    boxShadow: selectedTeacherId == prof.id ? '0 10px 15px -3px rgba(99, 102, 241, 0.08)' : 'none'
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--p-indigo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>
                    {prof.nom?.[0]}{prof.prenom?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>{prof.prenom} {prof.nom}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px' }}>{t('grades.' + (prof.grade || 'Teacher'))}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Attribution Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Step 1: Available Modules Selection */}
            <div className="card-academic" style={{ padding: '32px', opacity: selectedTeacherId ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                <h4 className="serif" style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{t('classes.tabTeachers')}</h4>
                {selectedTeacherId && (
                  <span className="badge-pro" style={{ padding: '6px 16px', borderRadius: '10px' }}>
                    {filteredTeachers.find(p => p.id === selectedTeacherId)?.prenom} {filteredTeachers.find(p => p.id === selectedTeacherId)?.nom}
                  </span>
                )}
              </div>

              {!selectedTeacherId ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 8 19 10 23 6"></polyline></svg>
                  <p style={{ fontWeight: '600' }}>{t('classes.selectTeacherFirst')}</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '32px' }}>
                    <label className="mnadm-label" style={{ marginBottom: '12px' }}>{t('classes.filterByLevel')}</label>
                    <select 
                      className="mnadm-input" value={selectedLevelId} onChange={e => setSelectedLevelId(e.target.value)}
                      style={{ maxWidth: '300px', borderRadius: '12px', fontWeight: '800', background: '#f8fafc' }}
                    >
                      <option value="">{t('common.all')}</option>
                      {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {modules.map(m => {
                      const isAssigned = teacherModules.some(tm => tm.id === m.id);
                      return (
                        <button 
                          key={m.id} 
                          onClick={() => isAssigned ? handleUnassignModule(m.id) : handleAssignModule(m.id)}
                          style={{ 
                            padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', fontSize: '13px', fontWeight: '800', textAlign: 'left',
                            background: isAssigned ? 'var(--p-indigo)' : 'white',
                            color: isAssigned ? 'white' : '#475569',
                            boxShadow: isAssigned ? '0 10px 15px -3px rgba(99, 102, 241, 0.25)' : '0 2px 4px rgba(0,0,0,0.02)',
                            border: isAssigned ? 'none' : '1px solid #e2e8f0',
                            transform: isAssigned ? 'scale(1.02)' : 'scale(1)'
                          }}
                        >
                          <div style={{ marginBottom: '8px', opacity: 0.8 }}>{isAssigned ? '✓ ' + t('common.completed') : '+ ' + t('common.new')}</div>
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Step 2: Currently Assigned List */}
            <div className="card-academic" style={{ padding: '32px', borderTop: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h4 className="serif" style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{t('classes.tabTeachers')}</h4>
                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '900' }}>
                  {teacherModules.length} {t('sidebar.classes').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {teacherModules.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '20px' }}>
                    {t('classes.noModulesAssigned')}
                  </div>
                ) : teacherModules.map(tm => (
                  <div 
                    key={tm.id} 
                    style={{ 
                      padding: '16px 24px', borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>{tm.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{tm.study_level}</div>
                    </div>
                    <button 
                      onClick={() => handleUnassignModule(tm.id)} 
                      style={{ padding: '8px 16px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={t('common.confirmation')}
        message={t('classes.confirmDelete')}
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageClasses;
