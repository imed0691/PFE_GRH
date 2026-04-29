import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageClasses() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('structure'); // 'structure' or 'teachers'

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
      } catch (error) { toast.error("Erreur de chargement des départements"); }
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
      if (res.ok) { toast.success("Niveau ajouté"); setNewLevelName(''); fetchLevels(); }
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
      if (res.ok) { toast.success("Section ajoutée"); setNewSectionName(''); fetchSections(); }
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
      if (res.ok) { toast.success("Groupe ajouté"); setNewGroupName(''); fetchGroups(); }
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
      if (res.ok) { toast.success("Module ajouté"); setNewModuleName(''); fetchModules(); }
    } catch (error) {}
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/${type}/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Supprimé");
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
      if (res.ok) { toast.success("Module assigné"); fetchTeacherModules(); }
      else toast.error("Erreur ou déjà assigné");
    } catch (error) {}
  };

  const handleUnassignModule = async (moduleId) => {
    if (!selectedTeacherId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/classes/teacher-modules?teacher_id=${selectedTeacherId}&module_id=${moduleId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast.success("Module retiré"); fetchTeacherModules(); }
    } catch (error) {}
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>
        Structure Pédagogique & Modules
      </h2>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('structure')} style={{ padding: '10px 20px', background: activeTab === 'structure' ? '#3b82f6' : 'transparent', color: activeTab === 'structure' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Gérer les Classes & Modules
        </button>
        <button onClick={() => setActiveTab('teachers')} style={{ padding: '10px 20px', background: activeTab === 'teachers' ? '#3b82f6' : 'transparent', color: activeTab === 'teachers' ? 'white' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Assigner Modules aux Profs
        </button>
      </div>

      {activeTab === 'structure' && (
        <>
          <div style={{ marginBottom: '30px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Choisir le Département :</label>
            <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} style={{ width: '100%', maxWidth: '400px', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="">-- Sélectionnez un département --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* LEVELS */}
            <div style={{ opacity: selectedDeptId ? 1 : 0.5, pointerEvents: selectedDeptId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>1. Niveaux</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px', maxHeight: '150px', overflowY: 'auto' }}>
                {levels.map(l => (
                  <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: selectedLevelId == l.id ? '#eff6ff' : '#f8fafc', border: selectedLevelId == l.id ? '1px solid #bfdbfe' : '1px solid transparent', cursor: 'pointer' }} onClick={() => setSelectedLevelId(l.id)}>
                    <span>{l.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('levels', l.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddLevel} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newLevelName} onChange={e => setNewLevelName(e.target.value)} placeholder="Ex: L1" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                <button type="submit" style={{ padding: '8px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>Ajouter</button>
              </form>
            </div>

            {/* MODULES (Attached to Level) */}
            <div style={{ opacity: selectedLevelId ? 1 : 0.5, pointerEvents: selectedLevelId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#10b981' }}>2. Modules du Niveau</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px', maxHeight: '150px', overflowY: 'auto' }}>
                {modules.map(m => (
                  <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: '#f8fafc' }}>
                    <span>{m.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('modules', m.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddModule} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newModuleName} onChange={e => setNewModuleName(e.target.value)} placeholder="Ex: Algorithmique" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                <button type="submit" style={{ padding: '8px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px' }}>Ajouter</button>
              </form>
            </div>

            {/* SECTIONS */}
            <div style={{ opacity: selectedLevelId ? 1 : 0.5, pointerEvents: selectedLevelId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>3. Sections</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px', maxHeight: '150px', overflowY: 'auto' }}>
                {sections.map(s => (
                  <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: selectedSectionId == s.id ? '#eff6ff' : '#f8fafc', border: selectedSectionId == s.id ? '1px solid #bfdbfe' : '1px solid transparent', cursor: 'pointer' }} onClick={() => setSelectedSectionId(s.id)}>
                    <span>{s.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('sections', s.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Ex: Sec A" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                <button type="submit" style={{ padding: '8px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>Ajouter</button>
              </form>
            </div>

            {/* GROUPS */}
            <div style={{ opacity: selectedSectionId ? 1 : 0.5, pointerEvents: selectedSectionId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>4. Groupes</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px', maxHeight: '150px', overflowY: 'auto' }}>
                {groups.map(g => (
                  <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: '5px', borderRadius: '6px', background: '#f8fafc' }}>
                    <span>{g.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('groups', g.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Ex: Grp 1" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
                <button type="submit" style={{ padding: '8px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>Ajouter</button>
              </form>
            </div>

          </div>
        </>
      )}

      {activeTab === 'teachers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Choisir un Professeur</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {teachers.map(t => (
                <div key={t.id} onClick={() => setSelectedTeacherId(t.id)} style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', background: selectedTeacherId === t.id ? '#eff6ff' : '#f8fafc', border: selectedTeacherId === t.id ? '1px solid #bfdbfe' : '1px solid transparent' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{t.nom} {t.prenom}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{t.department_name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ opacity: selectedTeacherId ? 1 : 0.5, pointerEvents: selectedTeacherId ? 'auto' : 'none', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Assigner des Modules</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Niveau d'étude :</label>
              <select value={selectedLevelId} onChange={e => setSelectedLevelId(e.target.value)} style={{ width: '100%', height: '42px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                <option value="">-- Sélectionnez --</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              
              {modules.length > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Modules disponibles :</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {modules.map(m => {
                      const isAssigned = teacherModules.some(tm => tm.id === m.id);
                      return (
                        <button key={m.id} onClick={() => isAssigned ? handleUnassignModule(m.id) : handleAssignModule(m.id)} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: isAssigned ? '#10b981' : '#e2e8f0', color: isAssigned ? 'white' : '#475569', fontWeight: '600' }}>
                          {isAssigned ? '✓ ' : '+ '} {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1e293b' }}>Modules enseignés par ce professeur :</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teacherModules.map(tm => (
                <li key={tm.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f1f5f9', marginBottom: '8px', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{tm.name}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '13px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>{tm.study_level}</span>
                  </div>
                  <button onClick={() => handleUnassignModule(tm.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Retirer</button>
                </li>
              ))}
              {teacherModules.length === 0 && <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucun module assigné.</li>}
            </ul>

          </div>

        </div>
      )}

    </div>
  );
}

export default ManageClasses;
