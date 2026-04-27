import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardHR.css';

function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const fetchDepartments = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/departments', { headers: { 'Authorization': `Bearer ${token}` } }); const data = await res.json(); if (res.ok) setDepartments(data); } catch (error) { toast.error(t('departments.errorFetching')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleAddDepartment = async (e) => {
    e.preventDefault(); if (!newDeptName.trim()) return;
    const token = localStorage.getItem('token'); const loadToast = toast.loading(t('departments.adding'));
    try {
      const res = await fetch('http://localhost:5000/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name: newDeptName }) });
      const data = await res.json(); toast.dismiss(loadToast);
      if (res.ok) { toast.success(t('departments.createdSuccess')); setNewDeptName(''); fetchDepartments(); }
      else { toast.error(data.message || t('departments.errorCreating')); }
    } catch (error) { toast.dismiss(loadToast); toast.error(t('common.serverError')); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t('departments.confirmDelete').replace('{name}', name))) return;
    try { const token = localStorage.getItem('token'); const res = await fetch(`http://localhost:5000/api/departments/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { toast.success(t('departments.deleted')); fetchDepartments(); } else { toast.error(t('departments.errorDeleting')); } } catch (error) { toast.error(t('common.serverError')); }
  };

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <form onSubmit={handleAddDepartment} style={{ display: 'flex', gap: '10px', marginBottom: '30px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4b5563' }}>{t('departments.newDeptName')}</label>
          <input type="text" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. Computer Science" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} required />
        </div>
        <button type="submit" className="btn-submit" style={{ margin: 0, padding: '10px 20px', height: 'fit-content' }}>{t('departments.addDepartment')}</button>
      </form>
      {loading ? <div className="loading-spinner">{t('departments.loadingDepts')}</div> : (
        <table className="modern-table">
          <thead><tr><th>{t('common.id')}</th><th>{t('departments.deptName')}</th><th>{t('common.actions')}</th></tr></thead>
          <tbody>
            {departments.map(d => (<tr key={d.id}><td>#{d.id}</td><td><strong>{d.name}</strong></td><td><button className="btn-delete" onClick={() => handleDelete(d.id, d.name)}>{t('common.delete')}</button></td></tr>))}
            {departments.length === 0 && <tr><td colSpan="3" className="empty-state">{t('departments.noDepts')}</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageDepartments;
