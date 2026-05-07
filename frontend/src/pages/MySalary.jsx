import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function MySalary({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use month numbers (1-12) or 'all'
  const [absMonth, setAbsMonth] = useState('all');
  const [extraMonth, setExtraMonth] = useState('all');
  
  const { t, locale } = useLanguage();

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

  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const currentMonthNum = new Date().getMonth() + 1; // 1-12

  // Filtering logic: aggregate all or find specific
  const getFilteredAbs = () => {
    if (absMonth === 'all') {
      let allAbs = [...data.current.absence_details];
      data.history.forEach(h => {
        if (h.absence_details) allAbs = [...allAbs, ...h.absence_details];
      });
      return allAbs;
    }
    if (Number(absMonth) === currentMonthNum) return data.current.absence_details;
    const mName = monthNames[absMonth - 1];
    const record = data.history.find(h => h.month === mName);
    return record ? record.absence_details : [];
  };

  const getFilteredExtra = () => {
    if (extraMonth === 'all') {
      let allExtra = [...data.current.extra_sessions];
      data.history.forEach(h => {
        if (h.extra_sessions) allExtra = [...allExtra, ...h.extra_sessions];
      });
      return allExtra;
    }
    if (Number(extraMonth) === currentMonthNum) return data.current.extra_sessions;
    const mName = monthNames[extraMonth - 1];
    const record = data.history.find(h => h.month === mName);
    return record ? record.extra_sessions : [];
  };

  return (
    <div className="animate-mnadm">
      {/* ── RÉSUMÉ DU MOIS EN COURS ── */}
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('salary.currentMonth') || 'Ma Situation Salariale'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '4px 0 0 0', fontWeight: '500' }}>
              {cap(new Date().toLocaleDateString(locale || 'fr-FR', { month: 'long', year: 'numeric' }))}
            </p>
          </div>
          <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            {data.current.grade ? (t('grades.' + data.current.grade) || data.current.grade) : (t('roles.TEACHER') || 'Enseignant')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{t('salary.baseSalary') || 'Salaire de Base'}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>{data.current.base_salary.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '700' }}>DA</span></div>
          </div>
          
          <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #dcfce7' }}>
            <div style={{ color: '#16a34a', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{t('salary.extraPay') || 'Séances Supp.'}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#16a34a' }}>+{data.current.extra_pay.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '700' }}>DA</span></div>
            <div style={{ fontSize: '12px', color: '#166534', marginTop: '8px', fontWeight: '600' }}>{data.current.extra_hours} {t('teacher.sessions') || 'séances'} x {data.current.hourly_rate} DA</div>
          </div>

          <div style={{ padding: '24px', background: '#fef2f2', borderRadius: '20px', border: '1px solid #fee2e2' }}>
            <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>{t('salary.penalties') || 'Retenues / Absences'}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626' }}>-{data.current.total_penalty.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '700' }}>DA</span></div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '8px', fontWeight: '600' }}>{data.current.absences} absences x {data.current.absence_penalty} DA</div>
          </div>
        </div>

        <div style={{ padding: '32px', background: 'linear-gradient(135deg, var(--p-indigo), #4f46e5)', borderRadius: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.2)' }}>
          <div>
            <div style={{ opacity: 0.8, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('salary.netToPay') || 'Salaire Net à Payer'}</div>
            <div style={{ fontSize: '42px', fontWeight: '900', marginTop: '8px' }}>{data.current.net_salary.toLocaleString()} <span style={{ fontSize: '20px', fontWeight: '700' }}>DA</span></div>
          </div>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          </div>
        </div>
      </div>
      
      {/* ── DÉTAILS AVEC FILTRES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        {/* ABSENCES CARD */}
        <div className="card-academic" style={{ borderTop: '4px solid #ef4444', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="serif" style={{ fontSize: '18px', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
              {t('salary.absenceDetails') || 'Détails des Retenues'}
            </h3>
            <select 
              className="mnadm-input-select"
              value={absMonth}
              onChange={(e) => setAbsMonth(e.target.value)}
              style={{ height: '32px', fontSize: '12px', padding: '0 30px 0 12px', width: '150px' }}
            >
              <option value="all">{cap(t('common.allMonths')) || 'Tous les mois'}</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>
                  {cap(new Date(2000, m - 1).toLocaleString(locale || 'fr-FR', { month: 'long' }))}
                </option>
              ))}
            </select>
          </div>
          
          {getFilteredAbs().length > 0 ? (
            <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {getFilteredAbs().map((a, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{a.reason}</div>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px', fontWeight: '600' }}>{cap(new Date(a.date).toLocaleDateString(locale || 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#dc2626', fontWeight: '900', fontSize: '14px' }}>-{a.is_extra ? data.current.hourly_rate : data.current.absence_penalty} DA</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '16px' }}>{t('salary.noAbsences') || 'Aucune donnée'}</div>
          )}
        </div>

        {/* SÉANCES SUPP CARD */}
        <div className="card-academic" style={{ borderTop: '4px solid #10b981', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="serif" style={{ fontSize: '18px', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
              {t('teacher.extraSessions') || 'Séances SUPP'}
            </h3>
            <select 
              className="mnadm-input-select"
              value={extraMonth}
              onChange={(e) => setExtraMonth(e.target.value)}
              style={{ height: '32px', fontSize: '12px', padding: '0 30px 0 12px', width: '150px' }}
            >
              <option value="all">{cap(t('common.allMonths')) || 'Tous les mois'}</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>
                  {cap(new Date(2000, m - 1).toLocaleString(locale || 'fr-FR', { month: 'long' }))}
                </option>
              ))}
            </select>
          </div>

          {getFilteredExtra().length > 0 ? (
            <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {getFilteredExtra().map((s, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{s.module_name}</div>
                    <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px', fontWeight: '600' }}>{cap(new Date(s.date).toLocaleDateString(locale || 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#16a34a', fontWeight: '900', fontSize: '14px' }}>+{data.current.hourly_rate} DA</div>
                    <div style={{ fontSize: '11px', color: '#166534' }}>{s.time?.substring(0,5)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '16px' }}>{t('salary.noExtraSessions') || 'Aucune donnée'}</div>
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
              {data.history.length > 0 ? data.history.map((h, i) => (
                <tr key={i} className="table-row-animate">
                  <td><strong style={{ color: '#0f172a' }}>{cap(h.month)} {h.year}</strong></td>
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
