import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './DashboardHR.css'; // Reusing the premium CSS

function AddEmployee({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'TEACHER', // default
    department_id: '',
    grade: 'Teacher',
    hourly_rate: '',
    absence_penalty: ''
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Session expired');
      return;
    }
    const loadToast = toast.loading('Creating account...');

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      toast.dismiss(loadToast);

      if (response.ok) {
        toast.success(`${formData.role} account created for ${formData.prenom}`);
        onSuccess(); // Return to list
      } else {
        toast.error(data.message || 'Error creating account');
      }
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error('Server error');
    }
  };

  return (
    <div className="add-employee-card">
      <div className="card-header">
        <h3>Add New Employee</h3>
        <p>Login credentials will be generated automatically.</p>
      </div>

      <form onSubmit={handleSubmit} className="add-form">
        <div className="form-row">
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" name="nom" value={formData.nom} onChange={handleChange} required placeholder="Doe" />
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required placeholder="John" />
          </div>
        </div>

        <div className="form-group">
          <label>University Email</label>
          <div style={{ display: 'flex' }}>
            <input 
              type="text" 
              value={formData.email.replace('@univ.dz', '')} 
              onChange={(e) => {
                const cleanValue = e.target.value.replace(/@/g, '');
                setFormData({ ...formData, email: cleanValue ? cleanValue + '@univ.dz' : '' });
              }} 
              required 
              placeholder="john.doe"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none', flex: 1 }}
            />
            <span style={{ 
              padding: '0 16px', 
              backgroundColor: '#f1f5f9', 
              color: '#64748b', 
              border: '1px solid #e2e8f0', 
              borderLeft: 'none', 
              borderTopRightRadius: '8px', 
              borderBottomRightRadius: '8px', 
              fontWeight: '500', 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '14px'
            }}>
              @univ.dz
            </span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Initial Password</label>
            <input type="text" name="password" value={formData.password} onChange={handleChange} required placeholder="Temporary password" />
          </div>
          
          <div className="form-group">
            <label>Department</label>
            <select name="department_id" value={formData.department_id} onChange={handleChange}>
              <option value="">-- No Department --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="TEACHER">Teacher</option>
              <option value="DEPARTMENT_HEAD">Head of Department</option>
              <option value="VICE_DEAN">Vice Dean</option>
              <option value="DEAN">Dean</option>
              <option value="VICE_RECTOR">Vice Rector</option>
              <option value="RECTOR">Rector</option>
            </select>
          </div>
        </div>

        {formData.role === 'TEACHER' && (
          <div className="form-row">
            <div className="form-group">
              <label>Academic Grade</label>
              <select name="grade" value={formData.grade} onChange={handleChange}>
                <option value="Teacher">Teacher (Default)</option>
                <option value="Vacataire">Vacataire</option>
                <option value="Assistant">Assistant</option>
                <option value="Maître-Assistant B">Maître-Assistant B (MAB)</option>
                <option value="Maître-Assistant A">Maître-Assistant A (MAA)</option>
                <option value="Maître de Conférences B">Maître de Conférences B (MCB)</option>
                <option value="Maître de Conférences A">Maître de Conférences A (MCA)</option>
                <option value="Professeur">Professeur</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Extra Hourly Rate (DA)</label>
              <input type="number" name="hourly_rate" value={formData.hourly_rate} onChange={handleChange} placeholder="e.g. 600" />
            </div>

            <div className="form-group">
              <label>Absence Penalty (DA)</label>
              <input type="number" name="absence_penalty" value={formData.absence_penalty} onChange={handleChange} placeholder="e.g. 2000" />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-submit">Create Account</button>
        </div>
      </form>
    </div>
  );
}

export default AddEmployee;
