import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import './DashboardHR.css';

function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

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

  const handleDeleteClick = (id, name) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const performDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch(`http://localhost:5000/api/departments/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); 
      if (res.ok) { toast.success(t('departments.deleted')); fetchDepartments(); } 
      else { toast.error(t('departments.errorDeleting')); } 
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const predefinedDepts = [
    t('departments.it'),
    t('departments.math'),
    t('departments.physics'),
    t('departments.biology'),
    t('departments.architecture')
  ];

  const handlePredefinedChange = (e) => {
    const val = e.target.value;
    if (val) {
      setNewDeptName(val);
    }
  };

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <form onSubmit={handleAddDepartment} className="grid-responsive" style={{ marginBottom: '30px', alignItems: 'flex-end', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{t('departments.selectOrType')}</label>
          <div className="form-row-responsive">
            <select 
              onChange={handlePredefinedChange}
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}
            >
              <option value="">{t('common.select')}</option>
              {predefinedDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <input 
              type="text" 
              value={newDeptName} 
              onChange={(e) => setNewDeptName(e.target.value)} 
              placeholder={t('departments.typeManual')}
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} 
              required 
            />
          </div>
        </div>
        <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '12px' }}>{t('departments.addDepartment')}</button>
      </form>
      {loading ? <div className="loading-spinner">{t('departments.loadingDepts')}</div> : (
        <table className="modern-table">
          <thead><tr><th>#</th><th>{t('common.id')}</th><th>{t('departments.deptName')}</th><th>{t('common.actions')}</th></tr></thead>
          <tbody>
            {departments.map((d, index) => (
              <tr key={d.id}>
                <td data-label="#">{index + 1}</td>
                <td data-label={t('common.id')}>#{d.id}</td>
                <td data-label={t('departments.deptName')}><strong>{d.name}</strong></td>
                <td data-label={t('common.actions')}>
                  <button className="btn-delete" onClick={() => handleDeleteClick(d.id, d.name)}>{t('common.delete')}</button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan="4" className="empty-state">{t('departments.noDepts')}</td></tr>}
          </tbody>
        </table>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        message={t('departments.confirmDelete').replace('{name}', confirmModal.name)}
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageDepartments;
