import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManagePromotions({ user }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // For teachers submitting a request
  const [requestedGrade, setRequestedGrade] = useState('');
  
  // For Dept Head recommendation
  const [recommendationText, setRecommendationText] = useState('');
  const [activePromoId, setActivePromoId] = useState(null);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/promotions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPromotions(await res.json());
      }
    } catch (error) {
      toast.error('Error loading promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleRequestPromotion = async (e) => {
    e.preventDefault();
    if (!requestedGrade) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          current_grade: user.grade || 'Teacher', 
          requested_grade: requestedGrade 
        })
      });

      if (res.ok) {
        toast.success('Promotion request submitted successfully!');
        setRequestedGrade('');
        fetchPromotions();
      } else {
        toast.error("Error submitting request");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const handleRecommend = async (id) => {
    if (!recommendationText.trim()) {
      toast.error("Please enter a recommendation first.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/recommend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recommendation: recommendationText })
      });

      if (res.ok) {
        toast.success('Recommendation submitted.');
        setActivePromoId(null);
        setRecommendationText('');
        fetchPromotions();
      } else {
        toast.error("Error saving recommendation");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/promotions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Promotion officially ${status.toLowerCase()}`);
        fetchPromotions();
      } else {
        toast.error("Error updating status");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const isDeptHead = user.role === 'DEPARTMENT_HEAD' || user.role === 'CHEF_DEPARTEMENT';
  const isHigherAdmin = ['DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN', 'RECTOR', 'RECTEUR'].includes(user.role);

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Promotion & Career Management</h3>

      {isTeacher && (
        <form onSubmit={handleRequestPromotion} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Request a Grade Promotion</h4>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Current Grade</label>
              <input type="text" value={user.grade || 'Teacher'} disabled style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#e2e8f0' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Requested Grade</label>
              <select value={requestedGrade} onChange={(e) => setRequestedGrade(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Select next grade --</option>
                <option value="Maître-Assistant B">Maître-Assistant B (MAB)</option>
                <option value="Maître-Assistant A">Maître-Assistant A (MAA)</option>
                <option value="Maître de Conférences B">Maître de Conférences B (MCB)</option>
                <option value="Maître de Conférences A">Maître de Conférences A (MCA)</option>
                <option value="Professeur">Professeur</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" style={{ margin: 0, padding: '10px 20px', height: 'fit-content', background: '#3b82f6' }}>Submit File</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-spinner">Loading promotions...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              {!isTeacher && <th>Candidate</th>}
              <th>Transition</th>
              <th>Dept. Recommendation</th>
              <th>Status</th>
              {!isTeacher && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {promotions.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.submission_date).toLocaleDateString('en-GB')}</td>
                
                {!isTeacher && (
                  <td>
                    <strong>{p.nom}</strong> {p.prenom}<br/>
                    <small style={{color: '#64748b'}}>{p.department_name}</small>
                  </td>
                )}
                
                <td>
                  <span style={{color: '#64748b'}}>{p.current_grade}</span><br/>
                  ↓<br/>
                  <strong>{p.requested_grade}</strong>
                </td>
                
                <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                  {p.dept_head_recommendation ? (
                    <div style={{ fontStyle: 'italic', color: '#475569', fontSize: '13px' }}>
                      "{p.dept_head_recommendation}"
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Pending evaluation</span>
                  )}
                </td>

                <td>
                  <span className="role-tag" style={{
                    background: p.status === 'Approved' ? '#d1fae5' : p.status === 'Rejected' ? '#fee2e2' : p.status === 'Recommended' ? '#dbeafe' : '#fef3c7',
                    color: p.status === 'Approved' ? '#065f46' : p.status === 'Rejected' ? '#991b1b' : p.status === 'Recommended' ? '#1e40af' : '#92400e'
                  }}>
                    {p.status}
                  </span>
                </td>

                {!isTeacher && (
                  <td>
                    {isDeptHead && p.status === 'Pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {activePromoId === p.id ? (
                          <>
                            <textarea 
                              placeholder="Write your recommendation..."
                              value={recommendationText}
                              onChange={(e) => setRecommendationText(e.target.value)}
                              style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => handleRecommend(p.id)} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}>Submit</button>
                              <button onClick={() => setActivePromoId(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </>
                        ) : (
                          <button onClick={() => setActivePromoId(p.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                            Add Recommendation
                          </button>
                        )}
                      </div>
                    )}

                    {isHigherAdmin && p.status === 'Recommended' && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => handleStatusUpdate(p.id, 'Approved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleStatusUpdate(p.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr><td colSpan={isTeacher ? 4 : 6} className="empty-state">No promotion records found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManagePromotions;
