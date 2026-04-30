import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import './Settings.css';

function Settings({ user, onProfileUpdate }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(localStorage.getItem('settings_active_tab') || 'profile');
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('settings_active_tab', tab);
  };
  
  const [profileData, setProfileData] = useState({ nom: user.nom, prenom: user.prenom });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(profileData)
      });
      if (res.ok) { toast.success(t('settings.profileSuccess')); onProfileUpdate(profileData); }
    } catch (err) { toast.error(t('common.serverError')); } finally { setLoadingProfile(false); }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await fetch('http://localhost:5000/api/profile-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(t('settings.profileSuccess'));
        onProfileUpdate({ profile_image: data.profile_image });
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setShowConfirmModal(false);
    try {
      const res = await fetch('http://localhost:5000/api/profile-image', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success(t('settings.profileSuccess'));
        onProfileUpdate({ profile_image: null });
      }
    } catch (err) {
      toast.error('Error removing photo');
    }
  };

  return (
    <div className="card-pro animate-float" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="settings-container-v2">
        <div className="settings-sidebar-v2">
          <button className={`settings-tab-v2 ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
            {t('settings.personalData')}
          </button>
          <button className={`settings-tab-v2 ${activeTab === 'security' ? 'active' : ''}`} onClick={() => handleTabChange('security')}>
            {t('settings.security')}
          </button>
          <button className={`settings-tab-v2 ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => handleTabChange('preferences')}>
            {t('settings.preferences')}
          </button>
        </div>

        <div className="settings-content-v2">
          {activeTab === 'profile' && (
            <div className="settings-pane-v2">
              <h2 className="serif" style={{ fontSize: '28px', marginBottom: '8px' }}>{t('settings.profileTitle')}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>{t('settings.profileDesc')}</p>
              
              <div className="profile-image-section" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative', background: 'var(--p-indigo)' }}>
                  {user.profile_image ? (
                    <img src={`http://localhost:5000${user.profile_image}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '48px', fontWeight: 'bold' }}>
                      {user.nom[0]}{user.prenom[0]}
                    </div>
                  )}
                  {uploadingImage && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner-academic" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></div>
                    </div>
                  )}
                </div>
                <div className="profile-actions-v2">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label htmlFor="profile-upload" className="btn-profile-v2 btn-profile-primary">
                      {uploadingImage ? '...' : t('settings.changePhoto')}
                    </label>
                    {user.profile_image && (
                      <button onClick={() => setShowConfirmModal(true)} className="btn-profile-v2 btn-remove">
                        {t('settings.removePhoto')}
                      </button>
                    )}
                  </div>
                  <input id="profile-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>{t('settings.photoSpecs')}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="mnadm-form-row">
                  <div className="mnadm-form-group">
                    <label className="mnadm-label">{t('addEmployee.lastName')}</label>
                    <input type="text" className="mnadm-input" value={profileData.nom} onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })} required />
                  </div>
                  <div className="mnadm-form-group">
                    <label className="mnadm-label">{t('addEmployee.firstName')}</label>
                    <input type="text" className="mnadm-input" value={profileData.prenom} onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" className="btn-confirm-pro" disabled={loadingProfile}>
                  {loadingProfile ? t('common.loading') : t('settings.updateInfo')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-pane-v2">
              <h2 className="serif" style={{ fontSize: '28px', marginBottom: '8px' }}>{t('settings.securityTitle')}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>{t('settings.securityDesc')}</p>
              
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="mnadm-form-group" style={{ maxWidth: '400px' }}>
                  <label className="mnadm-label">{t('settings.currentPassword')}</label>
                  <input type="password" className="mnadm-input" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                </div>
                <div className="mnadm-form-row">
                  <div className="mnadm-form-group">
                    <label className="mnadm-label">{t('settings.newPassword')}</label>
                    <input type="password" className="mnadm-input" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                  </div>
                  <div className="mnadm-form-group">
                    <label className="mnadm-label">{t('settings.confirmPassword')}</label>
                    <input type="password" className="mnadm-input" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-confirm-pro" disabled={loadingPassword}>
                  {t('settings.updateCredentials')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-pane-v2">
              <h2 className="serif" style={{ fontSize: '28px', marginBottom: '8px' }}>{t('settings.interfaceTitle')}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>{t('settings.interfaceDesc')}</p>
              
              <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-soft)' }}>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '24px' }}>{t('settings.portalLanguage')}</label>
                 <LanguageSwitcher variant="boxed" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REUSABLE CONFIRMATION MODAL */}
      <ConfirmModal 
        isOpen={showConfirmModal}
        message={t('settings.confirmRemovePhoto')}
        onConfirm={handleRemoveImage}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}

export default Settings;
