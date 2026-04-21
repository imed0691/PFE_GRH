import { useState } from 'react';
import toast from 'react-hot-toast';
import './DashboardHR.css'; // Reusing the premium CSS

function AddEmployee({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'ENSEIGNANT' // default
  });

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
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john.doe@univ.dz" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Initial Password</label>
            <input type="text" name="password" value={formData.password} onChange={handleChange} required placeholder="Temporary password" />
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="ENSEIGNANT">Teacher</option>
              <option value="CHEF_DEPARTEMENT">Head of Department</option>
              <option value="VICE_DOYEN">Vice Dean</option>
              <option value="DOYEN">Dean</option>
              <option value="VICE_RECTEUR">Vice Rector</option>
              <option value="RECTEUR">Rector</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-submit">Create Account</button>
        </div>
      </form>
    </div>
  );
}

export default AddEmployee;
