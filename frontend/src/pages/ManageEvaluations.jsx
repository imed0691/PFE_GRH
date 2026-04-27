import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageEvaluations({ user }) {
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
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
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ teacher_id: teacherId, academic_year: academicYear, rating, comments }) });
      if (res.ok) { toast.success(t('evaluations.submitted')); setTeacherId(''); setComments(''); fetchEvaluations(); } else { toast.error(t('evaluations.errorSubmitting')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('evaluations.title')}</h3>
      {isDeptHead && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>{t('evaluations.evaluateTeacher')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('common.teacher')}</label><select value={teacherId} onChange={e => setTeacherId(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="">{t('evaluations.selectTeacher')}</option>{teachers.map(tt => <option key={tt.id} value={tt.id}>{tt.nom} {tt.prenom}</option>)}</select></div>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('evaluations.academicYear')}</label><input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('evaluations.rating')}</label><input type="number" min="1" max="10" value={rating} onChange={e => setRating(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
          </div>
          <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('evaluations.comments')}</label><textarea value={comments} onChange={e => setComments(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder={t('evaluations.provideFeedback')}></textarea></div>
          <button type="submit" className="btn-submit" style={{ background: '#10b981' }}>{t('evaluations.submitEvaluation')}</button>
        </form>
      )}
      {loading ? <div className="loading-spinner">{t('evaluations.loadingEvals')}</div> : (
        <table className="modern-table">
          <thead><tr><th>{t('evaluations.year')}</th>{!isTeacher && <th>{t('common.teacher')}</th>}<th>{t('evaluations.evaluator')}</th><th>{t('evaluations.rating')}</th><th>{t('evaluations.comments')}</th><th>{t('common.date')}</th></tr></thead>
          <tbody>
            {evaluations.map(e => (<tr key={e.id}><td><strong>{e.academic_year}</strong></td>{!isTeacher && <td>{e.teacher_nom} {e.teacher_prenom}</td>}<td>{e.evaluator_nom} {e.evaluator_prenom}</td><td><span className="role-tag" style={{ background: e.rating >= 8 ? '#d1fae5' : e.rating >= 5 ? '#fef3c7' : '#fee2e2', color: e.rating >= 8 ? '#065f46' : e.rating >= 5 ? '#92400e' : '#991b1b' }}>{e.rating} / 10</span></td><td style={{ maxWidth: '300px', wordBreak: 'break-word', fontStyle: 'italic', fontSize: '13px' }}>"{e.comments}"</td><td>{new Date(e.created_at).toLocaleDateString()}</td></tr>))}
            {evaluations.length === 0 && <tr><td colSpan={isTeacher ? 5 : 6} className="empty-state">{t('evaluations.noEvals')}</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageEvaluations;
