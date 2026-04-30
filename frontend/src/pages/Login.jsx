import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Auth.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      console.error("Login error:", error);
      toast.error(t('login.serverIssue'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <LanguageSwitcher />
        </div>
        <div className="auth-header">
          <h2>{t('login.title')}</h2>
          <p>{t('login.welcome')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mnadm-form-group">
            <label className="mnadm-label">{t('login.email')}</label>
            <input 
              type="email" 
              className={`mnadm-input ${error ? 'input-error' : ''}`}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="john.doe@univ.dz"
            />
          </div>

          <div className="mnadm-form-group">
            <label className="mnadm-label">{t('login.password')}</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className={`mnadm-input ${error ? 'input-error' : ''}`}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="********"
                style={{ paddingRight: '40px' }}
              />
              <span 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  zIndex: 10
                }}
                title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </span>
            </div>
            {error && <span className="error-text" style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', display: 'block', fontWeight: '600' }}>{error}</span>}
          </div>

          <button type="submit" className="btn-confirm-pro" style={{ width: '100%', padding: '16px', fontSize: '15px', marginTop: '10px' }}>{t('login.signIn')}</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
