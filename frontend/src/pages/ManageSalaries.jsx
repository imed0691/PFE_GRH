import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
                <th style={{ width: '150px' }}>{t('salaries.baseSalary')}</th>
                <th style={{ width: '120px' }}>{t('salaries.extraHours')}</th>
                <th style={{ width: '250px' }}>{t('salaries.ratePenalty')}</th>
                <th style={{ width: '180px' }}>{t('salaries.netSalary')}</th>
                <th style={{ width: '120px' }}>{t('common.actions')}</th>
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
                  <td data-label={t('salaries.baseSalary')}><strong>{Number(s.base_salary || 0).toLocaleString()}</strong> <small>{t('common.currency')}</small></td>
                  <td data-label={t('salaries.extraHours')} style={{ textAlign: 'center' }}>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                      {s.extra_hours || 0}h
                    </span>
                  </td>
                  <td data-label={t('salaries.ratePenalty')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('salaries.rate')}</span>
                        <span style={{ color: 'var(--p-indigo)', fontWeight: '700' }}>{Number(s.hourly_rate || 0).toLocaleString()} {t('common.currency')}/h</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('salaries.absencesPenalty')}</span>
                        <span style={{ color: 'var(--danger)', fontWeight: '700' }}>-{Number(s.total_penalty || 0).toLocaleString()} {t('common.currency')}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label={t('salaries.netSalary')}>
                    <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', fontWeight: '800' }}>
                      {Number(s.net_salary || 0).toLocaleString()} {t('common.currency')}
                    </div>
                  </td>
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
                      style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {t('salaries.adjust')}
                    </button>
                  </td>
                </tr>
              ))}
              {salaries.length === 0 && <tr><td colSpan="8" className="empty-state-cell">{t('salaries.noTeachers')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editingSalary && createPortal(
        <div 
          style={{ 
            position: 'fixed', 
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 99999,
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => setEditingSalary(null)}
        >
          <div 
            key={editingSalary.id}
            style={{ 
              background: 'white', 
              padding: '24px 32px', 
              borderRadius: '20px', 
              width: '580px', 
              maxWidth: '100%', 
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)', 
              border: '1px solid #e2e8f0',
              position: 'relative',
              transition: 'none',
              transform: 'none',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', position: 'relative', textAlign: 'center' }}>
              <button 
                onClick={() => setEditingSalary(null)}
                style={{ position: 'absolute', right: '-10px', top: '-10px', background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer', padding: '10px' }}
              >
                &times;
              </button>
              <h3 style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>
                {t('salaries.adjustFor') || 'Adjust Salary for'}
              </h3>
              <p style={{ color: 'var(--p-indigo)', fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>
                {editingSalary.fullName || 'User'}
              </p>
            </div>

            <form onSubmit={handleSaveSalary}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                  <label className="mnadm-label" style={{ fontSize: '12px' }}>{t('salaries.baseSalary')}</label>
                  <input type="number" className="mnadm-input" value={editingSalary.base_salary} onChange={e => setEditingSalary({...editingSalary, base_salary: e.target.value})} required style={{ padding: '10px' }} />
                </div>
                <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                  <label className="mnadm-label" style={{ fontSize: '12px' }}>{t('salaries.extraHours')}</label>
                  <input type="number" className="mnadm-input" value={editingSalary.extra_hours} onChange={e => setEditingSalary({...editingSalary, extra_hours: e.target.value})} required style={{ padding: '10px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                  <label className="mnadm-label" style={{ fontSize: '12px' }}>{t('salaries.hourlyRate')}</label>
                  <input type="number" className="mnadm-input" value={editingSalary.hourly_rate} onChange={e => setEditingSalary({...editingSalary, hourly_rate: e.target.value})} required style={{ padding: '10px' }} />
                </div>
                <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                  <label className="mnadm-label" style={{ fontSize: '12px' }}>{t('salaries.absencePenalty')}</label>
                  <input type="number" className="mnadm-input" value={editingSalary.absence_penalty} onChange={e => setEditingSalary({...editingSalary, absence_penalty: e.target.value})} required style={{ padding: '10px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-confirm-pro" style={{ flex: 1, padding: '12px' }}>{t('common.save')}</button>
                <button type="button" onClick={() => setEditingSalary(null)} className="btn-cancel-pro" style={{ flex: 1, padding: '12px' }}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ManageSalaries;
