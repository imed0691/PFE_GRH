import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageSalaries() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const fetchSalaries = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/salaries', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setSalaries(await res.json()); } catch (error) { toast.error(t('salaries.errorLoading')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSalaries(); }, []);

  const handleAdjust = async (teacherId) => {
    try { const token = localStorage.getItem('token'); const res = await fetch(`http://localhost:5000/api/salaries/${teacherId}/recalculate`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { toast.success(t('salaries.updated')); fetchSalaries(); } else { toast.error(t('salaries.failedUpdate')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('salaries.title')}</h3>
      {loading ? <div className="loading-spinner">{t('salaries.calculating')}</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table">
            <thead><tr><th>#</th><th>{t('common.fullName')}</th><th>{t('salaries.grade')}</th><th>{t('salaries.baseSalary')}</th><th>{t('salaries.extraHours')}</th><th>{t('salaries.ratePenalty')}</th><th>{t('salaries.netSalary')}</th><th>{t('common.actions')}</th></tr></thead>
            <tbody>
              {salaries.map((s, index) => (
                <tr key={s.teacher_id}>
                  <td>{index + 1}</td>
                  <td><strong>{s.nom}</strong> {s.prenom}</td>
                  <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{s.grade}</span></td>
                  <td>{Number(s.base_salary).toLocaleString()} DA</td>
                  <td>{s.extra_hours || 0}h</td>
                  <td><small style={{ display: 'block', color: '#10b981' }}>{t('salaries.rate')} {Number(s.hourly_rate || 0).toLocaleString()} DA/h</small><small style={{ display: 'block', color: '#ef4444' }}>{t('salaries.absencesPenalty')} -{Number(s.total_penalty || 0).toLocaleString()} DA</small></td>
                  <td><strong style={{ color: '#1e293b', fontSize: '1.1em' }}>{Number(s.net_salary).toLocaleString()} DA</strong></td>
                  <td><button onClick={() => handleAdjust(s.teacher_id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>{t('salaries.adjust')}</button></td>
                </tr>
              ))}
              {salaries.length === 0 && <tr><td colSpan="8" className="empty-state">{t('salaries.noTeachers')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageSalaries;
