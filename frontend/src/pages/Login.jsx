import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import './Auth.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('login.fillAll'));
      return;
    }

    const loadToast = toast.loading(t('login.loggingIn'));

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      toast.dismiss(loadToast);
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`${t('login.welcomeUser')} ${data.user?.prenom || 'User'}!`);
        onLoginSuccess(data.user);
      } else {
        setError(data.message || t('login.incorrectCredentials'));
        toast.error(t('login.loginFailed'));
      }
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error(t('login.serverIssue'));
    }
  };

  return (
    <div className="login-page-v2">
      <div className="login-hero-section">
        <img src="/corporate_hero.png" alt="University" className="login-hero-bg" />
        <div className="login-hero-content animate-mnadm">
          <h1 className="serif" style={{ fontSize: '56px', color: 'white' }}>Academic Excellence & Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px' }}>
            A structured, professional environment for the modern university staff. 
            Streamlining HR processes with precision and ease.
          </p>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-card-v2 animate-mnadm">
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Sign In</h2>
          <p style={{ marginBottom: '32px', color: 'var(--text-secondary)' }}>Welcome back! Please enter your credentials.</p>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@university.edu"
                required
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '12px' }}>
              Sign In to Portal
            </button>
            
            {error && <div className="error-text-pro" style={{ marginTop: '20px', color: '#ef4444', fontWeight: '600', textAlign: 'center' }}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;