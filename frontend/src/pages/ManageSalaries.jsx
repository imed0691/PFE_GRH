import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManageSalaries() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ base_salary: 0, extra_hours: 0 });

  const fetchSalaries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/salaries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSalaries(await res.json());
      }
    } catch (error) {
      toast.error('Error loading salaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  const handleEdit = (s) => {
    setEditingId(s.id);
    setEditData({ base_salary: s.base_salary, extra_hours: s.extra_hours });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/salaries/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });
      
      if (res.ok) {
        toast.success('Salary updated');
        setEditingId(null);
        fetchSalaries(); // Refresh to get recalculated net salary
      } else {
        toast.error('Failed to update');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  if (loading) return <div className="loading-spinner">Calculating salaries...</div>;

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Teacher Salaries</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="modern-table" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Grade</th>
              <th>Base Salary (DA)</th>
              <th>Extra Hours</th>
              <th>Rate / Penalty</th>
              <th>Net Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map(s => (
              <tr key={s.id}>
                <td><strong>{s.nom}</strong> {s.prenom}</td>
                <td><span className="role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{s.grade}</span></td>
                
                {/* Base Salary */}
                <td>
                  {editingId === s.id ? (
                    <input 
                      type="number" 
                      value={editData.base_salary} 
                      onChange={(e) => setEditData({...editData, base_salary: parseInt(e.target.value) || 0})}
                      style={{ width: '100px', padding: '5px' }}
                    />
                  ) : (
                    <>{s.base_salary.toLocaleString()}</>
                  )}
                </td>

                {/* Extra Hours */}
                <td>
                  {editingId === s.id ? (
                    <input 
                      type="number" 
                      value={editData.extra_hours} 
                      onChange={(e) => setEditData({...editData, extra_hours: parseInt(e.target.value) || 0})}
                      style={{ width: '80px', padding: '5px' }}
                    />
                  ) : (
                    <>{s.extra_hours} h</>
                  )}
                </td>

                {/* Rates & Penalties Info */}
                <td>
                  <div style={{ fontSize: '0.85em', color: '#64748b' }}>
                    <div>Rate: {s.hourly_rate} DA/h</div>
                    <div style={{ color: '#ef4444' }}>Absences: {s.absences} (-{s.penalty_amount} DA)</div>
                  </div>
                </td>

                {/* Net Salary */}
                <td>
                  <strong style={{ color: '#10b981', fontSize: '1.1em' }}>
                    {s.final_salary.toLocaleString()} DA
                  </strong>
                </td>

                {/* Actions */}
                <td>
                  {editingId === s.id ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleSave(s.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                      <button onClick={handleCancel} style={{ background: '#64748b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(s)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                      Adjust
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {salaries.length === 0 && (
              <tr><td colSpan="7" className="empty-state">No teachers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageSalaries;
