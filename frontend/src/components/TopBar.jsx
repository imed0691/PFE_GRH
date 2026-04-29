import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './TopBar.css';

const TopBar = ({ title, onToggleMobileMenu }) => {
  const { locale } = useLanguage();
  const dateStr = new Date().toLocaleDateString(locale, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="topbar-academic">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button className="mobile-menu-toggle" onClick={onToggleMobileMenu}>
          ☰
        </button>
        <div className="topbar-path-serif">
          {title}
        </div>
      </div>

      <div className="topbar-utility-nav">
        <div className="topbar-date-display">
          {dateStr}
        </div>
        
        <div className="topbar-utility-item">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
