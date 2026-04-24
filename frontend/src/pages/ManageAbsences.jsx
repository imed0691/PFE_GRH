import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManageAbsences() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReasons, setExpandedReasons] = useState({});

  const toggleReason = (id) => {
    setExpandedReasons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAbsences(await res.json());
      }
    } catch (error) {
      toast.error('Error loading absences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Absence ${status === 'Approved' ? 'approved' : 'rejected'}`);
        fetchAbsences();
      } else {
        toast.error("Error updating status");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Absence Requests</h3>
      <table className="modern-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Teacher</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {absences.map(a => (
            <tr key={a.id}>
              <td>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
              <td><strong>{a.nom}</strong> {a.prenom}</td>
              <td>
                {expandedReasons[a.id] || a.reason.length <= 50 
                  ? a.reason 
                  : `${a.reason.substring(0, 50)}... `}
                {a.reason.length > 50 && (
                  <button 
                    onClick={() => toggleReason(a.id)}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline', padding: 0, marginLeft: '5px' }}
                  >
                    {expandedReasons[a.id] ? 'Voir moins' : 'Voir plus'}
                  </button>
                )}
              </td>
              <td>
                <span className="role-tag" style={{
                  background: a.status === 'Approved' ? '#d1fae5' : a.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                  color: a.status === 'Approved' ? '#065f46' : a.status === 'Rejected' ? '#991b1b' : '#92400e'
                }}>
                  {a.status === 'Pending' ? 'Pending' : a.status === 'Approved' ? 'Approved' : 'Rejected'}
                </span>
              </td>
              <td>
                {a.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleUpdateStatus(a.id, 'Approved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => handleUpdateStatus(a.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>✗</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {absences.length === 0 && (
            <tr><td colSpan="5" className="empty-state">No absence requests found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ManageAbsences;
