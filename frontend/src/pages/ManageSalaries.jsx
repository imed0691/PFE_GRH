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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleFinalizeMonth = async () => {
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const monthName = monthNames[selectedMonth];

    if (!window.confirm(`Voulez-vous vraiment clôturer le mois de ${monthName} ${selectedYear} ? \nCela va archiver les bulletins pour tous les enseignants.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/salaries/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ month: monthName, year: selectedYear.toString() })
      });
      if (res.ok) {
        toast.success(`Mois de ${monthName} ${selectedYear} clôturé avec succès !`);
        fetchSalaries();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Erreur lors de la clôture du mois");
      }
    } catch (e) { toast.error("Erreur de connexion"); }
  };

  useEffect(() => { fetchSalaries(); }, []);

  return (
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('salary.title') || 'Gestion de la Paie'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('salary.manageTitle') || 'Calculez et clôturez les salaires mensuels des enseignants.'}</p>
          </div>
          
          <div className="card-academic" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="mnadm-input" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ width: '150px', padding: '10px', borderRadius: '12px', fontWeight: '700', border: '1px solid #e2e8f0' }}
              >
                {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              
              <select 
                className="mnadm-input" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ width: '110px', padding: '10px', borderRadius: '12px', fontWeight: '700', border: '1px solid #e2e8f0' }}
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }}></div>

            <button 
              onClick={handleFinalizeMonth}
              className="btn-confirm-pro"
              style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              {t('salary.finalizeMonth') || 'Clôturer le Mois'}
            </button>
          </div>
        </div>

        {loading ? <div className="loading-spinner" style={{ padding: '40px' }}>{t('salary.calculating')}</div> : (
          <div className="modern-table-wrapper" style={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>{t('common.fullName')}</th>
                  <th style={{ width: '180px' }}>{t('salary.grade')}</th>
                  <th style={{ width: '160px' }}>{t('salary.baseSalary')} (DA)</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>{t('salary.extraHours')}</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>{t('sidebar.absences') || 'Absences'}</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>{t('salary.netSalary')}</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s, index) => (
                  <tr key={s.id} className="table-row-animate">
                    <td style={{ fontWeight: '800', color: '#94a3b8' }}>{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--p-indigo), #818cf8)', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                          {(s.nom?.[0] || '')}{(s.prenom?.[0] || '')}
                        </div>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                          {s.nom} {s.prenom}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pro badge-pro-info" style={{ textTransform: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                        {(() => {
                          const translated = t('grades.' + s.grade);
                          return translated.includes('.') ? s.grade : translated;
                        })()}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: '#1e293b' }}>
                      {Number(s.base_salary || 0).toLocaleString()} DA
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '6px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', border: '1px solid #dcfce7' }}>
                        +{s.extra_hours || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', border: '1px solid #fee2e2' }}>
                        -{s.absences || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', padding: '8px 16px', borderRadius: '12px', display: 'inline-block', fontWeight: '900', fontSize: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                        {Number(s.net_salary || 0).toLocaleString()} DA
                      </div>
                    </td>
                  </tr>
                ))}
                {salaries.length === 0 && <tr><td colSpan="7" className="empty-state-cell" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('salaries.noTeachers')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageSalaries;
