import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ user, activeView, setView, menuItems, onLogout, title, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className={`dashboard-layout ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <Sidebar 
        user={user} 
        activeView={activeView} 
        setView={(v) => { setView(v); setMobileMenuOpen(false); }} 
        menuItems={menuItems} 
        onLogout={onLogout}
        isOpen={mobileMenuOpen}
      />

      <div className="main-viewport">
        <TopBar 
          title={title} 
          onToggleMobileMenu={toggleMobileMenu}
        />

        <div className="content-container">
          {children}
        </div>
      </div>
      
      {/* Overlay for mobile menu */}
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>}
    </div>
  );
};

export default DashboardLayout;
