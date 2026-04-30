import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-card animate-mnadm" style={{ padding: '40px', borderRadius: '32px', maxWidth: '480px' }}>
        <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>
          {t('common.areYouSure') || 'Are you sure?'}
        </h3>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div className="custom-modal-footer" style={{ gap: '16px' }}>
          <button className="custom-modal-btn btn-confirm" style={{ borderRadius: '100px', padding: '14px 32px', fontSize: '15px', background: 'var(--p-indigo)' }} onClick={onConfirm}>
            {t('common.yes')}
          </button>
          <button className="custom-modal-btn btn-cancel" style={{ borderRadius: '100px', padding: '14px 32px', fontSize: '15px', border: '1px solid #e2e8f0', background: 'transparent' }} onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
