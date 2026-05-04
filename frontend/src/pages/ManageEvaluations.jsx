import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

function ManageEvaluations({ user }) {
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const calculateAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return currentMonth >= 9 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
  };

  const [academicYear] = useState(calculateAcademicYear());
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const { t } = useLanguage();

  const fetchEvaluations = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/evaluations', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setEvaluations(await res.json()); } catch (error) { toast.error(t('evaluations.errorLoading')); } finally { setLoading(false); }
  };

  const fetchTeachers = async () => {
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } }); const data = await res.json(); if (res.ok) setTeachers(data.filter(u => (u.role === 'TEACHER' || u.role === 'ENSEIGNANT') && u.department_id === user.department_id)); } catch (e) {}
  };

  useEffect(() => { fetchEvaluations(); if (user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT') fetchTeachers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId) return toast.error(t('evaluations.selectTeacher'));
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ teacher_id: teacherId, academic_year: academicYear, rating, comments }) });
      if (res.ok) { 
        toast.success(t('evaluations.submitted')); 
        setTeacherId(''); 
        setComments(''); 
        fetchEvaluations(); 
      } else { 
        const data = await res.json();
        toast.error(data.message || t('evaluations.errorSubmitting')); 
      }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';

  const teacherOptions = teachers.map(tt => ({ value: tt.id, label: `${tt.nom} ${tt.prenom}` }));

  return (
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('evaluations.title') || 'Évaluations Annuelles'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>{t('evaluations.manageTitle') || 'Consultez et gérez les évaluations de performance académique.'}</p>
        </div>

        {isDeptHead && (
          <form onSubmit={handleSubmit} className="card-academic" style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--p-indigo)', color: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>★</div>
                <h4 className="serif" style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>{t('evaluations.evaluateTeacher')}</h4>
              </div>
              <span className="badge-pro badge-pro-info" style={{ textTransform: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px' }}>
                {t('evaluations.academicYear')}: {academicYear}
              </span>
            </div>

            <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('common.teacher')}</label>
                <Select 
                  options={teacherOptions} 
                  value={teacherOptions.find(o => o.value === teacherId)} 
                  onChange={o => setTeacherId(o?.value || '')} 
                  placeholder={t('evaluations.selectTeacher')} 
                  isClearable 
                  isSearchable 
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: 'none',
                      background: 'white',
                      '&:hover': { borderColor: 'var(--p-indigo)' }
                    }),
                    option: (base, state) => ({
                      ...base,
                      fontWeight: '600',
                      background: state.isSelected ? 'var(--p-indigo)' : base.background,
                      '&:hover': { background: state.isSelected ? 'var(--p-indigo)' : '#f1f5f9' }
                    })
                  }}
                />
              </div>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('evaluations.rating')} (1-10)</label>
                <input 
                  type="number" 
                  className="mnadm-input" 
                  min="1" max="10" 
                  value={rating} 
                  onChange={e => setRating(e.target.value)} 
                  style={{ fontWeight: '800', borderRadius: '14px' }}
                  required 
                />
              </div>
            </div>

            <div className="mnadm-form-group" style={{ marginBottom: '24px' }}>
              <label className="mnadm-label">{t('evaluations.comments')}</label>
              <textarea 
                className="mnadm-input" 
                value={comments} 
                onChange={(e) => setComments(e.target.value)} 
                rows="3" 
                placeholder={t('evaluations.provideFeedback')}
                style={{ borderRadius: '16px', padding: '16px', fontSize: '14px', fontWeight: '600', background: 'white' }}
              ></textarea>
            </div>

            <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: '800', borderRadius: '14px' }}>
              {t('evaluations.submitEvaluation').toUpperCase()}
            </button>
          </form>
        )}

        {loading ? <div className="loading-spinner" style={{ padding: '40px' }}>{t('evaluations.loadingEvals')}</div> : (
          <div className="modern-table-wrapper" style={{ borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>{t('evaluations.year')}</th>
                  {!isTeacher && <th>{t('common.teacher')}</th>}
                  <th>{t('evaluations.evaluator')}</th>
                  <th style={{ width: '120px' }}>{t('evaluations.rating')}</th>
                  <th>{t('evaluations.comments')}</th>
                  <th style={{ width: '150px' }}>{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((e, index) => (
                  <tr key={e.id} className="table-row-animate">
                    <td style={{ fontWeight: '800', color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>{e.academic_year}</td>
                    {!isTeacher && (
                      <td>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{e.teacher_nom} {e.teacher_prenom}</div>
                      </td>
                    )}
                    <td style={{ color: '#64748b', fontWeight: '600' }}>{e.evaluator_nom} {e.evaluator_prenom}</td>
                    <td>
                      <span className={`badge-pro ${e.rating >= 8 ? 'badge-pro-success' : e.rating >= 5 ? 'badge-pro-warning' : 'badge-pro-danger'}`} style={{ borderRadius: '10px', padding: '6px 12px', fontWeight: '800' }}>
                        {e.rating} / 10
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', wordBreak: 'break-word', fontStyle: 'italic', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                      "{e.comments}"
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {evaluations.length === 0 && <tr><td colSpan={isTeacher ? 6 : 7} className="empty-state-cell" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>{t('evaluations.noEvals')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageEvaluations;
