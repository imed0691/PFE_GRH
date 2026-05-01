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
      toast.error(t('salary.errorLoading')); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFinalizeMonth = async () => {
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const now = new Date();
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    if (!window.confirm(`Voulez-vous vraiment clôturer le mois de ${currentMonth} ${currentYear} ? \nCela va archiver les bulletins et remettre à zéro les heures supplémentaires.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/salaries/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ month: currentMonth, year: currentYear })
      });
      if (res.ok) {
        toast.success(`Mois de ${currentMonth} clôturé avec succès !`);
        fetchSalaries();
      } else {
        toast.error("Erreur lors de la clôture du mois");
      }
    } catch (e) { toast.error("Erreur de connexion"); }
  };

  useEffect(() => { fetchSalaries(); }, []);

  return (
    <div className="card-academic" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '24px' }}>{t('salary.title')}</h3>
        <button 
          onClick={handleFinalizeMonth}
          className="btn-confirm-pro"
          style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          {t('salary.finalizeMonth') || 'Clôturer le Mois'}
        </button>
      </div>
      {loading ? <div className="loading-spinner">{t('salary.calculating')}</div> : (
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th style={{ width: '250px' }}>{t('common.fullName')}</th>
                <th style={{ width: '180px' }}>{t('salary.grade')}</th>
                <th style={{ width: '150px' }}>{t('salary.baseSalary')} (DA)</th>
                <th style={{ width: '120px' }}>{t('salary.extraHours')}</th>
                <th style={{ width: '120px' }}>{t('sidebar.absences') || 'Absences'}</th>
                <th style={{ width: '180px' }}>{t('salary.netSalary')}</th>
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
                  <td data-label={t('salary.grade')}>
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
