import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManageDocuments({ user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // For teachers requesting a document
  const [requestedType, setRequestedType] = useState('');
  
  // For Admin responding
  const [responseNote, setResponseNote] = useState('');
  const [activeDocId, setActiveDocId] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (error) {
      toast.error('Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleRequestDocument = async (e) => {
    e.preventDefault();
    if (!requestedType) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: requestedType })
      });

      if (res.ok) {
        toast.success('Document request submitted!');
        setRequestedType('');
        fetchDocuments();
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
      const res = await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, response_note: responseNote })
      });

      if (res.ok) {
        toast.success(`Request marked as ${status}`);
        setActiveDocId(null);
        setResponseNote('');
        fetchDocuments();
      } else {
        toast.error("Error updating status");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';
  const isAdmin = ['HR', 'RH', 'DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN', 'DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT'].includes(user.role);

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Administrative Documents</h3>

      {isTeacher && (
        <form onSubmit={handleRequestDocument} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Request a New Document</h4>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Document Type</label>
              <select value={requestedType} onChange={(e) => setRequestedType(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Select a document type --</option>
                <option value="Work Certificate (Attestation de travail)">Work Certificate (Attestation de travail)</option>
                <option value="Salary Slip (Fiche de paie)">Salary Slip (Fiche de paie)</option>
                <option value="Teaching Load Certificate">Teaching Load Certificate</option>
                <option value="Mission Order (Ordre de mission)">Mission Order (Ordre de mission)</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" style={{ margin: 0, padding: '10px 20px', height: 'fit-content', background: '#3b82f6' }}>Submit Request</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-spinner">Loading requests...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              {!isTeacher && <th>Teacher</th>}
              <th>Document Type</th>
              <th>Status</th>
              <th>Admin Note</th>
              {!isTeacher && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {documents.map(d => (
              <tr key={d.id}>
                <td>{new Date(d.request_date).toLocaleDateString('en-GB')}</td>
                
                {!isTeacher && (
                  <td>
                    <strong>{d.nom}</strong> {d.prenom}<br/>
                    <small style={{color: '#64748b'}}>{d.department_name || '-'}</small>
                  </td>
                )}
                
                <td><strong>{d.type}</strong></td>
                
                <td>
                  <span className="role-tag" style={{
                    background: d.status === 'Delivered' ? '#d1fae5' : d.status === 'Rejected' ? '#fee2e2' : d.status === 'Processing' ? '#fef3c7' : '#e2e8f0',
                    color: d.status === 'Delivered' ? '#065f46' : d.status === 'Rejected' ? '#991b1b' : d.status === 'Processing' ? '#92400e' : '#475569'
                  }}>
                    {d.status}
                  </span>
                </td>

                <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                  {d.response_note ? (
                    <div style={{ fontStyle: 'italic', color: '#475569', fontSize: '13px' }}>
                      "{d.response_note}"
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  )}
                </td>

                {!isTeacher && (
                  <td>
                    {d.status !== 'Delivered' && d.status !== 'Rejected' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {activeDocId === d.id ? (
                          <>
                            <textarea 
                              placeholder="e.g. Available at office 102"
                              value={responseNote}
                              onChange={(e) => setResponseNote(e.target.value)}
                              style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                            />
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => handleStatusUpdate(d.id, 'Processing')} style={{ flex: 1, background: '#f59e0b', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Mark Processing</button>
                              <button onClick={() => handleStatusUpdate(d.id, 'Delivered')} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Mark Delivered</button>
                            </div>
                            <button onClick={() => setActiveDocId(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setActiveDocId(d.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                            Process Request
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {documents.length === 0 && (
              <tr><td colSpan={isTeacher ? 4 : 6} className="empty-state">No document requests found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageDocuments;
