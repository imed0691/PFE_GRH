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
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || t('salary.errorLoad');
        toast.error(`${msg} (${res.status})`);
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
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('salary.currentMonth') || 'Ma Situation Salariale'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '4px 0 0 0', fontWeight: '500' }}>
              {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            {current.grade ? (t('grades.' + current.grade) || current.grade) : (t('roles.TEACHER') || 'Enseignant')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{t('salary.baseSalary') || 'Salaire de Base'}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>{current.base_salary.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '700' }}>DA</span></div>
          </div>
          
          <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #dcfce7', transition: 'all 0.3s ease' }}>
            <div style={{ color: '#16a34a', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{t('salary.extraPay') || 'Séances Supp.'}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#16a34a' }}>+{current.extra_pay.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '700' }}>DA</span></div>
            <div style={{ fontSize: '12px', color: '#166534', marginTop: '8px', fontWeight: '600' }}>{current.extra_hours} {t('teacher.sessions') || 'séances'} x {current.hourly_rate} DA</div>
          </div>

          <div style={{ padding: '24px', background: '#fef2f2', borderRadius: '20px', border: '1px solid #fee2e2', transition: 'all 0.3s ease' }}>
            <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{t('salary.penalties') || 'Retenues / Absences'}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626' }}>-{current.total_penalty.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '700' }}>DA</span></div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '8px', fontWeight: '600' }}>{current.absences} absences x {current.absence_penalty} DA</div>
          </div>
        </div>

        <div style={{ padding: '32px', background: 'linear-gradient(135deg, var(--p-indigo), #4f46e5)', borderRadius: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.2)' }}>
          <div>
            <div style={{ opacity: 0.8, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('salary.netToPay') || 'Salaire Net à Payer'}</div>
            <div style={{ fontSize: '42px', fontWeight: '900', marginTop: '8px' }}>{current.net_salary.toLocaleString()} <span style={{ fontSize: '20px', fontWeight: '700' }}>DA</span></div>
          </div>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          </div>
        </div>
      </div>
      
      {/* ── DÉTAILS DES ABSENCES ET SÉANCES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        {/* ABSENCES */}
        <div className="card-academic" style={{ borderTop: '4px solid #ef4444', padding: '24px' }}>
          <h3 className="serif" style={{ fontSize: '18px', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
            {t('salary.absenceDetails') || 'Détails des Absences'}
          </h3>
          {current.absence_details && current.absence_details.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {current.absence_details.map((a, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{a.reason}</div>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px', fontWeight: '600' }}>{new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#dc2626', fontWeight: '900', fontSize: '14px' }}>-{a.is_extra ? current.hourly_rate : current.absence_penalty} DA</div>
                    {a.is_extra && <span className="badge-pro" style={{ fontSize: '9px', padding: '2px 6px' }}>EXTRA</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '16px' }}>{t('salary.noAbsences') || 'Aucune absence enregistrée'}</div>
          )}
        </div>

        {/* SÉANCES SUPP */}
        <div className="card-academic" style={{ borderTop: '4px solid #10b981', padding: '24px' }}>
          <h3 className="serif" style={{ fontSize: '18px', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
            {t('teacher.extraSessions') || 'Séances Supplémentaires'}
          </h3>
          {current.extra_sessions && current.extra_sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {current.extra_sessions.map((s, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{s.module_name}</div>
                    <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px', fontWeight: '600' }}>{new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#16a34a', fontWeight: '900', fontSize: '14px' }}>+{current.hourly_rate} DA</div>
                    <div style={{ fontSize: '11px', color: '#166534' }}>{s.time?.substring(0,5)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '16px' }}>{t('salary.noExtraSessions') || 'Aucune séance supplémentaire'}</div>
          )}
        </div>
      </div>

      {/* ── HISTORIQUE DES PAIEMENTS ── */}
      <div className="card-academic" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--p-indigo)' }}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h3 className="serif" style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>{t('salary.history') || 'Historique des Bulletins de Paie'}</h3>
        </div>
        <div className="modern-table-wrapper" style={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>{t('common.period') || 'Période'}</th>
                <th>{t('salary.baseSalary')}</th>
                <th>{t('salary.extraPay')}</th>
                <th>{t('salary.penalties')}</th>
                <th>{t('salary.netSalary')}</th>
                <th style={{ textAlign: 'center' }}>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {data.history.length > 0 ? data.history.map(h => (
                <tr key={h.id} className="table-row-animate">
                  <td><strong style={{ color: '#0f172a' }}>{h.month} {h.year}</strong></td>
                  <td style={{ fontWeight: '600' }}>{h.base_salary?.toLocaleString()} DA</td>
                  <td style={{ color: '#16a34a', fontWeight: '700' }}>+{ (h.extra_hours || 0) * (h.hourly_rate || 0) } DA</td>
                  <td style={{ color: '#dc2626', fontWeight: '700' }}>-{h.total_penalty?.toLocaleString()} DA</td>
                  <td>
                    <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', padding: '6px 12px', borderRadius: '10px', display: 'inline-block', fontWeight: '900', fontSize: '14px' }}>
                      {h.net_salary?.toLocaleString()} DA
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span className="badge-pro badge-pro-success" style={{ fontWeight: '800', borderRadius: '8px' }}>{h.status?.toUpperCase() || 'PAYÉ'}</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="empty-state-cell" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('salary.noHistory') || 'Aucun historique disponible'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MySalary;
