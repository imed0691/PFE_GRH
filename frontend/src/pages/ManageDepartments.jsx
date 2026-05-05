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
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('departments.title') || 'Gestion des Départements'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('departments.manageTitle') || 'Configurez et gérez les unités organisationnelles de votre établissement.'}</p>
        </div>

        <form onSubmit={handleAddDepartment} className="card-academic" style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--p-indigo)', color: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>+</div>
            <h4 className="serif" style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>{t('departments.addNew') || 'Ajouter un nouveau département'}</h4>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label className="mnadm-label">{t('departments.selectOrType')}</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select 
                  className="mnadm-input"
                  onChange={handlePredefinedChange}
                  style={{ flex: '0.4', fontWeight: '700', borderRadius: '14px' }}
                >
                  <option value="">{t('common.select')}</option>
                  {predefinedDepts.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <input 
                  className="mnadm-input"
                  type="text" 
                  value={newDeptName} 
                  onChange={(e) => setNewDeptName(e.target.value)} 
                  placeholder={t('departments.typeManual')}
                  style={{ flex: '0.6', fontWeight: '700', borderRadius: '14px' }}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn-confirm-pro" style={{ padding: '16px 40px', borderRadius: '14px', fontSize: '15px', fontWeight: '800' }}>{t('departments.addDepartment').toUpperCase()}</button>
          </div>
        </form>

        {loading ? <div className="loading-spinner" style={{ padding: '40px' }}>{t('departments.loadingDepts')}</div> : (
          <div className="modern-table-wrapper" style={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th style={{ width: '100px' }}>{t('common.id')}</th>
                  <th>{t('departments.deptName')}</th>
                  <th style={{ textAlign: 'center', width: '150px' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d, index) => (
                  <tr key={d.id} className="table-row-animate">
                    <td style={{ fontWeight: '800', color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ fontWeight: '600', color: '#64748b' }}>#{d.id}</td>
                    <td style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>
                      {(() => {
                        const translated = t('departments.' + d.name);
                        return translated.includes('.') ? d.name : translated;
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                          className="btn-delete-pro" 
                          style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }} 
                          onClick={() => handleDeleteClick(d.id, d.name)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && <tr><td colSpan="4" className="empty-state-cell" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('departments.noDepts')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={t('common.confirmation')}
        message={t('departments.confirmDelete').replace('{name}', confirmModal.name)}
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageDepartments;
