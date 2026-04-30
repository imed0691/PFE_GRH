import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ user, activeView, setView, menuItems, onLogout, title, children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar 
        user={user} 
        activeView={activeView} 
        setView={setView} 
        menuItems={menuItems} 
        onLogout={onLogout}
      />

      <div className="main-viewport">
        <TopBar title={title} />

        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
