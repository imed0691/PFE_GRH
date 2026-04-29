import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageSalaries() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSalary, setEditingSalary] = useState(null); // { id, base_salary, extra_hours, fullName }
  const { t } = useLanguage();

  const fetchSalaries = async () => {
    setLoading(true);
    try { 
      const token = localStorage.getItem('token'); 
      const res = await fetch('http://localhost:5000/api/salaries', { headers: { 'Authorization': `Bearer ${token}` } }); 
      if (res.ok) setSalaries(await res.json()); 
    } catch (error) { 
      toast.error(t('salaries.errorLoading')); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchSalaries(); }, []);

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/salaries/${editingSalary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          base_salary: editingSalary.base_salary,
          extra_hours: editingSalary.extra_hours,
          hourly_rate: editingSalary.hourly_rate,
          absence_penalty: editingSalary.absence_penalty
        })
      });
      if (res.ok) {
        toast.success(t('salaries.updated'));
        setEditingSalary(null);
        fetchSalaries();
      } else {
        toast.error(t('salaries.failedUpdate'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    }
  };

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('salaries.title')}</h3>
      {loading ? <div className="loading-spinner">{t('salaries.calculating')}</div> : (
        <div className="table-scroll-pro">
          <table className="modern-table">
            <thead><tr><th>#</th><th>{t('common.fullName')}</th><th>{t('salaries.grade')}</th><th>{t('salaries.baseSalary')}</th><th>{t('salaries.extraHours')}</th><th>{t('salaries.ratePenalty')}</th><th>{t('salaries.netSalary')}</th><th>{t('common.actions')}</th></tr></thead>
            <tbody>
              {salaries.map((s, index) => (
                <tr key={s.id}>
                  <td data-label="#">{index + 1}</td>
                  <td data-label={t('common.fullName')}><strong>{s.nom}</strong> {s.prenom}</td>
                  <td data-label={t('salaries.grade')}><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{t(`grades.${s.grade}`) || s.grade}</span></td>
                  <td data-label={t('salaries.baseSalary')}>{Number(s.base_salary).toLocaleString()} {t('common.currency')}</td>
                  <td data-label={t('salaries.extraHours')}>{s.extra_hours || 0}h</td>
                  <td data-label={t('salaries.ratePenalty')}><small style={{ display: 'block', color: 'var(--p-indigo)' }}>{t('salaries.rate')} {Number(s.hourly_rate || 0).toLocaleString()} {t('common.currency')}/h</small><small style={{ display: 'block', color: '#ef4444' }}>{t('salaries.absencesPenalty')} -{Number(s.total_penalty || 0).toLocaleString()} {t('common.currency')}</small></td>
                  <td data-label={t('salaries.netSalary')}><strong style={{ color: '#1e293b', fontSize: '1.1em' }}>{Number(s.net_salary).toLocaleString()} {t('common.currency')}</strong></td>
                  <td data-label={t('common.actions')}>
                    <button 
                      onClick={() => setEditingSalary({ 
                        id: s.id, 
                        base_salary: s.base_salary, 
                        extra_hours: s.extra_hours, 
                        hourly_rate: s.hourly_rate,
                        absence_penalty: s.absence_penalty,
                        fullName: `${s.prenom} ${s.nom}` 
                      })} 
                      className="btn-confirm-pro"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      {t('salaries.adjust')}
                    </button>
                  </td>
                </tr>
              ))}
              {salaries.length === 0 && <tr><td colSpan="8" className="empty-state">{t('salaries.noTeachers')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editingSalary && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content animate-mnadm" style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '450px', maxWidth: '95%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>{t('salaries.adjustFor')} {editingSalary.fullName}</h3>
            <form onSubmit={handleSaveSalary}>
              <div className="form-row-responsive" style={{ marginBottom: '15px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('salaries.baseSalary')} (DA)</label>
                  <input type="number" value={editingSalary.base_salary} onChange={e => setEditingSalary({...editingSalary, base_salary: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('salaries.extraHours')} (h)</label>
                  <input type="number" value={editingSalary.extra_hours} onChange={e => setEditingSalary({...editingSalary, extra_hours: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div className="form-row-responsive" style={{ marginBottom: '24px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('addEmployee.extraHourlyRate')} (DA/h)</label>
                  <input type="number" value={editingSalary.hourly_rate} onChange={e => setEditingSalary({...editingSalary, hourly_rate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('addEmployee.absencePenalty')} (DA)</label>
                  <input type="number" value={editingSalary.absence_penalty} onChange={e => setEditingSalary({...editingSalary, absence_penalty: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-confirm-pro" style={{ flex: 1 }}>{t('common.save')}</button>
                <button type="button" onClick={() => setEditingSalary(null)} className="btn-cancel-pro" style={{ flex: 1 }}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSalaries;
