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
    <div className="card-academic" style={{ padding: '32px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '24px' }}>{t('evaluations.title')}</h3>
      {isDeptHead && (
        <form onSubmit={handleSubmit} className="card-academic" style={{ marginBottom: '32px', background: 'var(--bg-main)', border: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h4 style={{ margin: 0, color: 'var(--secondary)', fontSize: '18px' }}>{t('evaluations.evaluateTeacher')}</h4>
            <span className="badge-pro badge-pro-info">
              {t('evaluations.academicYear')}: {academicYear}
            </span>
          </div>
          <div className="mnadm-form-row">
            <div className="mnadm-form-group">
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
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '4px',
                    fontSize: '14px',
                    boxShadow: 'none',
                    '&:hover': { borderColor: 'var(--p-indigo)' }
                  })
                }}
              />
            </div>
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('evaluations.rating')} (1-10)</label>
              <input type="number" className="mnadm-input" min="1" max="10" value={rating} onChange={e => setRating(e.target.value)} required />
            </div>
          </div>
          <div className="mnadm-form-group">
            <label className="mnadm-label">{t('evaluations.comments')}</label>
            <textarea className="mnadm-input" value={comments} onChange={e => setComments(e.target.value)} rows="3" placeholder={t('evaluations.provideFeedback')}></textarea>
          </div>
          <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '16px', fontSize: '15px' }}>{t('evaluations.submitEvaluation')}</button>
        </form>
      )}
      {loading ? <div className="loading-spinner">{t('evaluations.loadingEvals')}</div> : (
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead><tr><th>#</th><th>{t('evaluations.year')}</th>{!isTeacher && <th>{t('common.teacher')}</th>}<th>{t('evaluations.evaluator')}</th><th>{t('evaluations.rating')}</th><th>{t('evaluations.comments')}</th><th>{t('common.date')}</th></tr></thead>
            <tbody>
              {evaluations.map((e, index) => (
                <tr key={e.id}>
                  <td>{index + 1}</td>
                  <td><strong>{e.academic_year}</strong></td>
                  {!isTeacher && <td><strong>{e.teacher_nom}</strong> {e.teacher_prenom}</td>}
                  <td>{e.evaluator_nom} {e.evaluator_prenom}</td>
                  <td>
                    <span className={`badge-pro ${e.rating >= 8 ? 'badge-pro-success' : e.rating >= 5 ? 'badge-pro-warning' : 'badge-pro-danger'}`}>
                      {e.rating} / 10
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px', wordBreak: 'break-word', fontStyle: 'italic', fontSize: '13px', color: 'var(--text-secondary)' }}>"{e.comments}"</td>
                  <td>{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {evaluations.length === 0 && <tr><td colSpan={isTeacher ? 6 : 7} className="empty-state">{t('evaluations.noEvals')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageEvaluations;
