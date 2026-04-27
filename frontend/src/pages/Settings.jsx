import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';
import './Settings.css';

function Settings({ user, onProfileUpdate }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [profileData, setProfileData] = useState({
    nom: user.nom,
    prenom: user.prenom
  });
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        toast.success(t('settings.profileSuccess'));
        onProfileUpdate(profileData);
      } else {
        toast.error(t('settings.profileError'));
      }
    } catch (err) {
      toast.error(t('common.serverError'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const validatePassword = (pass) => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('changePassword.mismatch'));
      return;
    }
    if (!validatePassword(passwordData.newPassword)) {
      toast.error(t('changePassword.requirements'));
      return;
    }

    setLoadingPassword(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('settings.updatePassword'));
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || t('changePassword.error'));
      }
    } catch (err) {
      toast.error(t('common.serverError'));
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="settings-wrapper animate-fade-in">
      <div className="settings-sidebar">
        <button 
          className={`tab-link ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">👤</span>
          <div className="tab-text">
            <span className="tab-label">{t('settings.profile')}</span>
            <span className="tab-desc">Your personal info</span>
          </div>
        </button>
        <button 
          className={`tab-link ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span className="tab-icon">🔒</span>
          <div className="tab-text">
            <span className="tab-label">{t('settings.security')}</span>
            <span className="tab-desc">Password & access</span>
          </div>
        </button>
        <button 
          className={`tab-link ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <span className="tab-icon">🌐</span>
          <div className="tab-text">
            <span className="tab-label">{t('lang.label')}</span>
            <span className="tab-desc">Language & region</span>
          </div>
        </button>
      </div>

      <div className="settings-content-card">
        {activeTab === 'profile' && (
          <div className="tab-pane animate-slide-up">
            <div className="pane-header">
              <h3>{t('settings.profile')}</h3>
              <p>Manage your account name and identity</p>
            </div>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('addEmployee.lastName')}</label>
                  <input 
                    type="text" 
                    value={profileData.nom} 
                    onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>{t('addEmployee.firstName')}</label>
                  <input 
                    type="text" 
                    value={profileData.prenom} 
                    onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="form-footer">
                <button type="submit" className="btn-pro-save" disabled={loadingProfile}>
                  {loadingProfile ? t('common.loading') : t('settings.updateProfile')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="tab-pane animate-slide-up">
            <div className="pane-header">
              <h3>{t('settings.security')}</h3>
              <p>Keep your account secure with a strong password</p>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>{t('settings.currentPassword')}</label>
                <input 
                  type="password" 
                  value={passwordData.currentPassword} 
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                  required 
                  placeholder="••••••••"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('settings.newPassword')}</label>
                  <input 
                    type="password" 
                    value={passwordData.newPassword} 
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                    required 
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="form-group">
                  <label>{t('settings.confirmPassword')}</label>
                  <input 
                    type="password" 
                    value={passwordData.confirmPassword} 
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                    required 
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              <p className="requirements-text-pro">{t('changePassword.requirements')}</p>
              <div className="form-footer">
                <button type="submit" className="btn-pro-save" disabled={loadingPassword}>
                  {loadingPassword ? t('common.loading') : t('settings.updatePassword')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="tab-pane animate-slide-up">
            <div className="pane-header">
              <h3>{t('lang.label')}</h3>
              <p>Choose your preferred language for the interface</p>
            </div>
            <div className="pro-lang-container">
               <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
