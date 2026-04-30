import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './TopBar.css';

const TopBar = ({ title, toggleSidebar }) => {
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
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
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
