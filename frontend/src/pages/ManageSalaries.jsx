import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageSalaries() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="card-academic" style={{ padding: '32px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '24px' }}>{t('salaries.title')}</h3>
      {loading ? <div className="loading-spinner">{t('salaries.calculating')}</div> : (
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th style={{ width: '250px' }}>{t('common.fullName')}</th>
                <th style={{ width: '180px' }}>{t('salaries.grade')}</th>
                <th style={{ width: '150px' }}>{t('salaries.baseSalary')} (DA)</th>
                <th style={{ width: '120px' }}>{t('salaries.extraHours')}</th>
                <th style={{ width: '120px' }}>{t('sidebar.absences') || 'Absences'}</th>
                <th style={{ width: '180px' }}>{t('salaries.netSalary')}</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((s, index) => (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td data-label={t('common.fullName')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="user-avatar-mini" style={{ width: '32px', height: '32px', background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                        {(s.nom?.[0] || '')}{(s.prenom?.[0] || '')}
                      </div>
                      <div>
                        <strong>{s.nom}</strong> {s.prenom}
                      </div>
                    </div>
                  </td>
                  <td data-label={t('salaries.grade')}>
                    <span className="role-tag">
                      {(() => {
                        const translated = t('grades.' + s.grade);
                        return translated.includes('.') ? s.grade : translated;
                      })()}
                    </span>
                  </td>
                  <td data-label={t('salaries.baseSalary')}>
                    <strong style={{ color: '#0f172a' }}>{Number(s.base_salary || 0).toLocaleString()} DA</strong>
                  </td>
                  <td data-label={t('salaries.extraHours')} style={{ textAlign: 'center' }}>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                      {s.extra_hours || 0}h
                    </span>
                  </td>
                  <td data-label={t('sidebar.absences')} style={{ textAlign: 'center' }}>
                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                      {s.absences || 0}
                    </span>
                  </td>
                  <td data-label={t('salaries.netSalary')}>
                    <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', fontWeight: '800', fontSize: '15px' }}>
                      {Number(s.net_salary || 0).toLocaleString()} DA
                    </div>
                  </td>
                </tr>
              ))}
              {salaries.length === 0 && <tr><td colSpan="7" className="empty-state-cell">{t('salaries.noTeachers')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default ManageSalaries;
