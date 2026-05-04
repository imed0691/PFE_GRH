import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';

function ManageReminders() {
  const [teachers, setTeachers] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Cascading filters states
  const [targetCategory, setTargetCategory] = useState('all');
  const [filterDeptId, setFilterDeptId] = useState('');

  const [formData, setFormData] = useState({
    teacher_id: '',
    message: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [resUsers, resDepts] = await Promise.all([
          fetch('http://localhost:5000/api/users', { headers }),
          fetch('http://localhost:5000/api/departments', { headers })
        ]);

        if (resUsers.ok && resDepts.ok) {
          const users = await resUsers.json();
          const depts = await resDepts.json();
          
          setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT'));
          setDeptHeads(users.filter(u => u.role === 'DEPARTMENT_HEAD' || u.role === 'CHEF_DEPARTEMENT'));
          setDepartments(depts);
        }
      } catch (error) {
        toast.error('Error loading data');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption) => {
    setFormData({ ...formData, teacher_id: selectedOption ? selectedOption.value : '' });
  };

  const handleCategoryChange = (e) => {
    setTargetCategory(e.target.value);
    setFilterDeptId('');
    setFormData({ ...formData, teacher_id: '' });
  };

  // Compute filtered options for react-select
  let filteredOptions = [];
  if (targetCategory === 'dept_head') {
    let heads = deptHeads;
    if (filterDeptId) heads = heads.filter(h => h.department_id === parseInt(filterDeptId));
    filteredOptions = heads.map(h => ({ value: h.id, label: `${h.nom} ${h.prenom} - ${h.department_name || 'Head'}` }));
  } else if (targetCategory === 'teacher') {
    let ts = teachers;
    if (filterDeptId) ts = ts.filter(t => t.department_id === parseInt(filterDeptId));
    filteredOptions = ts.map(t => ({ value: t.id, label: `${t.nom} ${t.prenom} (${t.department_name || 'No Dept'})` }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message) return toast.error("Message is required");

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          // If category is 'all', teacher_id is null
          teacher_id: targetCategory === 'all' ? null : formData.teacher_id
        })
      });

      if (res.ok) {
        toast.success("Reminder sent successfully");
        setFormData({ ...formData, message: '' });
      } else {
        toast.error("Error sending reminder");
      }
    } catch (error) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-card" style={{ padding: '20px', maxWidth: '600px' }}>
      <h3 style={{ marginBottom: '20px' }}>Send Reminder</h3>
      
      <form onSubmit={handleSubmit} className="add-form">
        
        {/* Step 1: Category */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>1. Recipient Category</label>
          <select value={targetCategory} onChange={handleCategoryChange} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <option value="all">All Staff (General Announcement)</option>
            <option value="dept_head">Specific Department Head</option>
            <option value="teacher">Specific Teacher</option>
          </select>
        </div>

        {/* Step 2: Department Filter (Optional) */}
        {targetCategory !== 'all' && (
          <div className="form-group" style={{ marginBottom: '15px', animation: 'fadeIn 0.3s' }}>
            <label>2. Filter by Department (Optional)</label>
            <select value={filterDeptId} onChange={(e) => setFilterDeptId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <option value="">-- All Departments --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Final Selection */}
        {targetCategory !== 'all' && (
          <div className="form-group" style={{ marginBottom: '15px', animation: 'fadeIn 0.3s' }}>
            <label>3. Select {targetCategory === 'dept_head' ? 'Department Head' : 'Teacher'}</label>
            <Select
              options={filteredOptions}
              onChange={handleSelectChange}
              placeholder={`Search ${targetCategory === 'dept_head' ? 'head' : 'teacher'}...`}
              isClearable
              isSearchable
              value={filteredOptions.find(o => o.value === formData.teacher_id) || null}
              styles={{
                control: (base) => ({
                  ...base,
                  padding: '2px',
                  borderRadius: '8px',
                  borderColor: '#e5e7eb',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#d97706' }
                })
              }}
            />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Reminder Type</label>
          <select name="type" value={formData.type} onChange={handleChange} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <option value="info">Information (Blue)</option>
            <option value="warning">Important / Warning (Orange)</option>
            <option value="error">Urgent (Red)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>Message</label>
          <textarea 
            name="message" 
            value={formData.message} 
            onChange={handleChange} 
            required 
            rows="4" 
            placeholder="E.g. Don't forget to submit grades before the 15th..."
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          ></textarea>
        </div>

        <button type="submit" disabled={loading} style={{
          background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
        }}>
          {loading ? 'Sending...' : 'Send Reminder 📢'}
        </button>
      </form>
    </div>
  );
}

export default ManageReminders;
