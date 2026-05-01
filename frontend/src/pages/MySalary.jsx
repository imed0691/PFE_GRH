import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function MySalary({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const fetchSalaryData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/my-salary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        toast.error(`${t('salary.errorLoad')} (${res.status})`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, []);

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;
  if (!data) return <div className="card-academic">{t('common.noData')}</div>;

  const current = data.current;

  return (
    <div className="animate-mnadm">
      {/* ── RÉSUMÉ DU MOIS EN COURS ── */}
      <div className="card-academic" style={{ marginBottom: '32px', borderLeft: '5px solid var(--p-indigo)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px' }}>{t('salary.currentMonth') || 'Situation Salariale Actuelle'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="role-tag" style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
              {t('grades.' + current.grade) || current.grade}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="salary-card" style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
            <span style={{ fontSize: '11px', color: '#888', fontWeight: '800', textTransform: 'uppercase' }}>{t('salary.baseSalary') || 'Salaire de Base'}</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginTop: '8px' }}>{current.base_salary.toLocaleString()} <small style={{ fontSize: '12px' }}>DA</small></div>
          </div>
          
          <div className="salary-card" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase' }}>{t('salary.extraPay') || 'Séances Supp.'}</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>+{current.extra_pay.toLocaleString()} <small style={{ fontSize: '12px' }}>DA</small></div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{current.extra_hours} {t('teacher.sessions') || 'séances'} x {current.hourly_rate} DA</div>
          </div>

          <div className="salary-card" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase' }}>{t('salary.penalties') || 'Retenues / Absences'}</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginTop: '8px' }}>-{current.total_penalty.toLocaleString()} <small style={{ fontSize: '12px' }}>DA</small></div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{current.absences} absences x {current.absence_penalty} DA</div>
          </div>
        </div>

        <div style={{ marginTop: '32px', padding: '24px', background: 'var(--p-indigo)', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, opacity: 0.9, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('salary.netToPay') || 'Net à Payer'}</h4>
            <div style={{ fontSize: '36px', fontWeight: '900', marginTop: '4px' }}>{current.net_salary.toLocaleString()} <small style={{ fontSize: '18px' }}>DA</small></div>
          </div>
          <div style={{ opacity: 0.2 }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          </div>
        </div>
      </div>

      {/* ── HISTORIQUE DES PAIEMENTS ── */}
      <div className="card-academic">
        <h3 style={{ marginBottom: '24px' }}>{t('salary.history') || 'Historique des Bulletins'}</h3>
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('salary.baseSalary')}</th>
                <th>{t('salary.extraPay')}</th>
                <th>{t('salary.penalties')}</th>
                <th>{t('salary.netSalary') || 'Salaire Net'}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {data.history.length > 0 ? data.history.map(h => (
                <tr key={h.id}>
                  <td><strong>{h.month} {h.year}</strong></td>
                  <td>{h.base_salary?.toLocaleString()} DA</td>
                  <td style={{ color: '#10b981' }}>+{h.extra_hours * h.hourly_rate} DA</td>
                  <td style={{ color: '#ef4444' }}>-{h.total_penalty?.toLocaleString()} DA</td>
                  <td style={{ fontWeight: '800' }}>{h.net_salary?.toLocaleString()} DA</td>
                  <td>
                    <span className="badge-pro badge-pro-success">{h.status || 'Paid'}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>{t('salary.noHistory') || 'Aucun historique de paiement disponible.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MySalary;
