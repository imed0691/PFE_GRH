import { useState } from 'react';
import toast from 'react-hot-toast';
import './Auth.css';

function Login({ onLoginSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const loadToast = toast.loading("Connexion en cours...");

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      toast.dismiss(loadToast);
      
      if (response.ok) {
        toast.success(`Bienvenue, ${data.user?.prenom || 'Utilisateur'} !`);
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Email ou mot de passe incorrect');
        toast.error('Échec de la connexion');
      }
    } catch (error) {
      toast.dismiss(loadToast);
      console.error("Login error:", error);
      toast.error("Problème de connexion avec le serveur");
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>Connexion</h2>
        <p>Heureux de vous revoir sur le portail</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className={error ? 'input-error' : ''}
            placeholder="jean.dupont@email.com"
          />
        </div>

        <div className="form-group">
          <label>Mot de passe</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className={error ? 'input-error' : ''}
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
          {error && <span className="error-text">{error}</span>}
        </div>

        <button type="submit" className="auth-btn pulse-on-hover">Se connecter</button>
      </form>
      
      <p className="toggle-link">
        Vous n'avez pas de compte ? <span onClick={onSwitchToSignup}>Inscrivez-vous</span>
      </p>
    </div>
  );
}

export default Login;