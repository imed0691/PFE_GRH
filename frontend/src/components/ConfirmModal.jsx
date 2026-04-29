import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-card animate-mnadm">
        <div className="custom-modal-header">
          <h3>{t('common.confirm')}</h3>
        </div>
        <div className="custom-modal-body">
          <p>{message}</p>
        </div>
        <div className="custom-modal-footer">
          <button className="custom-modal-btn btn-confirm" onClick={onConfirm}>
            {t('common.yes')}
          </button>
          <button className="custom-modal-btn btn-cancel" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
