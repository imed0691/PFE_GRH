import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ user, activeView, setView, menuItems, onLogout, title, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      <Sidebar 
        user={user} 
        activeView={activeView} 
        setView={(view) => { setView(view); setIsSidebarOpen(false); }} 
        menuItems={menuItems} 
        onLogout={onLogout}
        isOpen={isSidebarOpen}
      />

      <div className="main-viewport">
        <TopBar title={title} toggleSidebar={toggleSidebar} />

        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
