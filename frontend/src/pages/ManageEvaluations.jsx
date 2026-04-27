import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManageEvaluations({ user }) {
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [teacherId, setTeacherId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/evaluations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEvaluations(await res.json());
      }
    } catch (error) {
      toast.error('Error loading evaluations');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Filter to show teachers in the same department
        const myTeachers = data.filter(u => 
          (u.role === 'TEACHER' || u.role === 'ENSEIGNANT') && 
          u.department_id === user.department_id
        );
        setTeachers(myTeachers);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchEvaluations();
    if (user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT') {
      fetchTeachers();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          academic_year: academicYear,
          rating,
          comments
        })
      });

      if (res.ok) {
        toast.success('Evaluation submitted successfully!');
        setTeacherId('');
        setComments('');
        fetchEvaluations();
      } else {
        toast.error("Error submitting evaluation");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Performance Evaluations</h3>

      {isDeptHead && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Evaluate a Teacher</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Teacher</label>
              <select value={teacherId} onChange={e => setTeacherId(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Select Teacher --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Academic Year</label>
              <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Rating (1-10)</label>
              <input type="number" min="1" max="10" value={rating} onChange={e => setRating(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Comments & Observations</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Provide detailed feedback..."></textarea>
          </div>
          <button type="submit" className="btn-submit" style={{ background: '#10b981' }}>Submit Evaluation</button>
        </form>
      )}

      {loading ? (
        <div className="loading-spinner">Loading evaluations...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Year</th>
              {!isTeacher && <th>Teacher</th>}
              <th>Evaluator</th>
              <th>Rating</th>
              <th>Comments</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map(e => (
              <tr key={e.id}>
                <td><strong>{e.academic_year}</strong></td>
                {!isTeacher && <td>{e.teacher_nom} {e.teacher_prenom}</td>}
                <td>{e.evaluator_nom} {e.evaluator_prenom}</td>
                <td>
                   <span className="role-tag" style={{ 
                     background: e.rating >= 8 ? '#d1fae5' : e.rating >= 5 ? '#fef3c7' : '#fee2e2',
                     color: e.rating >= 8 ? '#065f46' : e.rating >= 5 ? '#92400e' : '#991b1b'
                   }}>
                     {e.rating} / 10
                   </span>
                </td>
                <td style={{ maxWidth: '300px', wordBreak: 'break-word', fontStyle: 'italic', fontSize: '13px' }}>
                  "{e.comments}"
                </td>
                <td>{new Date(e.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {evaluations.length === 0 && (
              <tr><td colSpan={isTeacher ? 5 : 6} className="empty-state">No evaluations found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageEvaluations;
