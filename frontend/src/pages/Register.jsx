import { useState } from 'react';
import toast from 'react-hot-toast';
import './Auth.css';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    role: 'Employee',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false); // Ajout du state pour le mot de passe

  // Nouveaux rôles adaptés à une université algérienne
  const roles = [
    { value: 'Employee', label: 'Employé / Enseignant (ATS, Professeur)' },
    { value: 'Manager', label: 'Chef de Département / Doyen / Recteur' },
    { value: 'HR_Manager', label: 'Service du Personnel / RH' },
    { value: 'Admin', label: 'Administrateur Informatique' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Retire l'erreur en temps réel quand l'utilisateur tape
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    
    // Regex pour vérifier la validité de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Veuillez entrer une adresse email valide";
    }

    // Vérification de la longueur du mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit faire au moins 6 caractères';
    }

    setErrors(newErrors);
    // Si l'objet est vide (0 erreur), la fonction retourne true
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // On lance la validation avant d'appeler l'API
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    const loadToast = toast.loading("Création de votre compte...");

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      toast.dismiss(loadToast);
      
      if (response.ok) {
        toast.success("Compte créé avec succès ! Bienvenue !");
        onSignupSuccess();
      } else {
        toast.error(data.message || "L'inscription a échoué");
      }
    } catch (error) {
      toast.dismiss(loadToast);
      console.error("Registration error:", error);
      toast.error("Problème de connexion avec le serveur");
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>Créer un compte</h2>
        <p>Rejoignez-nous en quelques clics</p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        {/* On groupe le nom et prénom sur la même ligne avec .form-row */}
        <div className="form-row">
          <div className="form-group">
            <label>Nom</label>
            <input 
              name="nom" 
              value={formData.nom}
              onChange={handleChange} 
              className={errors.nom ? 'input-error' : ''}
              placeholder="Dupont"
            />
            {errors.nom && <span className="error-text">{errors.nom}</span>}
          </div>
          <div className="form-group">
            <label>Prénom</label>
            <input 
              name="prenom" 
              value={formData.prenom}
              onChange={handleChange} 
              className={errors.prenom ? 'input-error' : ''}
              placeholder="Jean"
            />
            {errors.prenom && <span className="error-text">{errors.prenom}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Rôle (Droits d'accès sur le logiciel)</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email}
            onChange={handleChange} 
            className={errors.email ? 'input-error' : ''}
            placeholder="jean.dupont@email.com"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Mot de passe</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              value={formData.password}
              onChange={handleChange} 
              className={errors.password ? 'input-error' : ''}
              placeholder="••••••••"
              style={{ paddingRight: '40px' }}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#718096',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none'
              }}
              title={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </span>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}
          {!errors.password && <span className="help-text">Minimum 6 caractères</span>}
        </div>

        <button type="submit" className="auth-btn pulse-on-hover">Créer mon compte</button>
      </form>
      <p className="toggle-link">
        Vous avez déjà un compte ? <span onClick={onSwitchToLogin}>Connectez-vous</span>
      </p>
    </div>
  );
}

export default Signup;