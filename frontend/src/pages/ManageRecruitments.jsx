import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManageRecruitments({ user }) {
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);

  // For Dept Head requesting
  const [positionTitle, setPositionTitle] = useState('');
  const [vacanciesCount, setVacanciesCount] = useState(1);
  const [justification, setJustification] = useState('');

  const fetchRecruitments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/recruitments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRecruitments(await res.json());
      }
    } catch (error) {
      toast.error('Error loading recruitments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitments();
  }, []);

  const handleRequestRecruitment = async (e) => {
    e.preventDefault();
    if (!positionTitle || !justification) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/recruitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          position_title: positionTitle,
          vacancies_count: vacanciesCount,
          justification: justification
        })
      });

      if (res.ok) {
        toast.success('Recruitment request submitted!');
        setPositionTitle('');
        setVacanciesCount(1);
        setJustification('');
        fetchRecruitments();
      } else {
        toast.error("Error submitting request");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/recruitments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Recruitment ${status.replace('_', ' ')}`);
        fetchRecruitments();
      } else {
        toast.error("Error updating status");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isDean = user.role === 'DEAN' || user.role === 'DOYEN' || user.role === 'VICE_DEAN' || user.role === 'VICE_DOYEN';
  const isRector = user.role === 'RECTOR' || user.role === 'RECTEUR' || user.role === 'VICE_RECTOR' || user.role === 'VICE_RECTEUR';
  const isHR = user.role === 'HR' || user.role === 'RH' || user.role === 'HR_MANAGER' || user.role === 'RH_MANAGER';

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Staff Recruitment Management</h3>

      {isDeptHead && (
        <form onSubmit={handleRequestRecruitment} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Request New Hires</h4>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Position Title</label>
              <input type="text" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} required placeholder="e.g. Professeur de Mathématiques" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Number Needed</label>
              <input type="number" min="1" value={vacanciesCount} onChange={(e) => setVacanciesCount(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: '1 1 100%' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Justification / Need Assessment</label>
              <textarea value={justification} onChange={(e) => setJustification(e.target.value)} required rows="3" placeholder="Explain why this department needs this recruitment..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
            </div>
            <button type="submit" className="btn-submit" style={{ margin: 0, padding: '10px 20px', background: '#3b82f6' }}>Submit Request</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-spinner">Loading recruitments...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Department</th>
              <th>Position & Vacancies</th>
              <th>Justification</th>
              <th>Status</th>
              {!isDeptHead && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {recruitments.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.request_date).toLocaleDateString('en-GB')}</td>
                <td>
                  <strong>{r.department_name || '-'}</strong><br/>
                  <small style={{color: '#64748b'}}>Req by: {r.nom} {r.prenom}</small>
                </td>
                <td>
                  <strong>{r.position_title}</strong><br/>
                  <span style={{color: '#3b82f6', fontSize: '13px'}}>{r.vacancies_count} Vacancy(ies)</span>
                </td>
                <td style={{ maxWidth: '250px', wordBreak: 'break-word' }}>
                  <div style={{ fontStyle: 'italic', color: '#475569', fontSize: '13px' }}>
                    "{r.justification}"
                  </div>
                </td>
                <td>
                  <span className="role-tag" style={{
                    background: r.status === 'Rector_Approved' || r.status === 'Completed' ? '#d1fae5' : r.status === 'Rejected' ? '#fee2e2' : r.status === 'Published' ? '#eff6ff' : r.status === 'Dean_Approved' ? '#dbeafe' : '#fef3c7',
                    color: r.status === 'Rector_Approved' || r.status === 'Completed' ? '#065f46' : r.status === 'Rejected' ? '#991b1b' : r.status === 'Published' ? '#1e40af' : r.status === 'Dean_Approved' ? '#1e40af' : '#92400e'
                  }}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                {!isDeptHead && (
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {isDean && r.status === 'Pending' && (
                        <>
                          <button onClick={() => handleStatusUpdate(r.id, 'Dean_Approved')} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Approve (Faculty Level)</button>
                          <button onClick={() => handleStatusUpdate(r.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
                        </>
                      )}
                      
                      {isRector && r.status === 'Dean_Approved' && (
                        <>
                          <button onClick={() => handleStatusUpdate(r.id, 'Rector_Approved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Final Approval</button>
                          <button onClick={() => handleStatusUpdate(r.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
                        </>
                      )}

                      {isHR && r.status === 'Rector_Approved' && (
                        <button onClick={() => handleStatusUpdate(r.id, 'Published')} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>📢 Publish Vacancy</button>
                      )}

                      {isHR && r.status === 'Published' && (
                        <button onClick={() => handleStatusUpdate(r.id, 'Completed')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✅ Hiring Completed</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {recruitments.length === 0 && (
              <tr><td colSpan={isDeptHead ? 5 : 6} className="empty-state">No recruitment requests found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageRecruitments;
