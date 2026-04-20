import { useState } from 'react';
import './Auth.css';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    role: 'etudiant',
    email: '',
    password: ''
  });

  const roles = [
    'HR Manager', 'Rector', 'Vice Rector', 
    'Dean', 'Vice Dean', 'Head of Department', 
    'Teacher', 'Student'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert("Registration successful!");
        onSignupSuccess();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Error during registration");
    }
  };

  return (
    <div className="auth-card">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Last Name</label>
          <input name="nom" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>First Name</label>
          <input name="prenom" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" name="password" onChange={handleChange} required />
        </div>
        <button type="submit" className="auth-btn">Sign Up</button>
      </form>
      <p className="toggle-link" onClick={onSwitchToLogin}>Already have an account? Login</p>
    </div>
  );
}

export default Signup;