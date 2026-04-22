import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './DashboardHR.css';

function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
      }
    } catch (error) {
      toast.error('Error fetching departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    const token = localStorage.getItem('token');
    const loadToast = toast.loading('Adding department...');

    try {
      const res = await fetch('http://localhost:5000/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDeptName })
      });

      const data = await res.json();
      toast.dismiss(loadToast);

      if (res.ok) {
        toast.success('Department created successfully!');
        setNewDeptName('');
        fetchDepartments();
      } else {
        toast.error(data.message || 'Error creating department');
      }
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error('Server error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the department "${name}"? Teachers in this department will have no assigned department.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Department deleted');
        fetchDepartments();
      } else {
        toast.error('Error deleting department');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <form onSubmit={handleAddDepartment} style={{ display: 'flex', gap: '10px', marginBottom: '30px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4b5563' }}>New Department Name</label>
          <input 
            type="text" 
            value={newDeptName} 
            onChange={(e) => setNewDeptName(e.target.value)} 
            placeholder="e.g. Computer Science" 
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            required
          />
        </div>
        <button type="submit" className="btn-submit" style={{ margin: 0, padding: '10px 20px', height: 'fit-content' }}>
          ➕ Add Department
        </button>
      </form>

      {loading ? (
        <div className="loading-spinner">Loading departments...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id}>
                <td>#{d.id}</td>
                <td><strong>{d.name}</strong></td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(d.id, d.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr><td colSpan="3" className="empty-state">No departments found. Create one above!</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageDepartments;
