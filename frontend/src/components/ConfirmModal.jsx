import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return createPortal(
    <div className="custom-modal-overlay">
      <div className="custom-modal-card animate-mnadm">
        {title && (
          <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>
            {title}
          </h3>
        )}
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div className="custom-modal-footer">
          <button className="custom-modal-btn btn-confirm" onClick={onConfirm}>
            {t('common.yes')}
          </button>
          <button className="custom-modal-btn btn-cancel" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
