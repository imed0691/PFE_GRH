import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import toast from 'react-hot-toast';
import './ChangePasswordModal.css';

function ChangePasswordModal({ onPasswordChanged }) {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return minLength && hasUpper && hasLower && hasNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      toast.error(t('changePassword.requirements'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('changePassword.mismatch'));
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (res.ok) {
        toast.success(t('changePassword.success'));
        onPasswordChanged();
      } else {
        toast.error(t('changePassword.error'));
      }
    } catch (err) {
      toast.error(t('common.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-overlay">
      <div className="change-password-modal">
        <div className="modal-header">
          <h2>{t('changePassword.title')}</h2>
          <p>{t('changePassword.subtitle')}</p>
          <div className="password-requirements">
            {t('changePassword.requirements')}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('changePassword.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>{t('changePassword.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? t('common.loading') : t('changePassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
