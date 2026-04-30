import { useLanguage } from "../i18n/LanguageContext";
import "./Sidebar.css";

function Sidebar({ user, activeView, setView, menuItems, onLogout, isOpen }) {
  const { t } = useLanguage();

  return (
    <aside className={`sidebar-academic ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ padding: '40px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src="/logo_univ.png" alt="Logo" style={{ width: '190px', height: 'auto' }} />
      </div>

      <nav className="sidebar-nav-academic">
        {menuItems.filter(item => item.id !== 'settings').map((item) => (
          <button
            key={item.id}
            className={`nav-item-academic ${activeView === item.id ? "active" : ""}`}
            onClick={() => setView(item.id)}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span className="sidebar-badge-academic">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer-academic">
        <div className="user-profile-mini">
          <div className="user-avatar-mini">
            {user.profile_image ? (
              <img src={`http://localhost:5000${user.profile_image}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>{user.prenom[0]}{user.nom[0]}</>
            )}
          </div>
          <div className="user-info-mini">
            <h4>{user.prenom} {user.nom}</h4>
            <p>{t('roles.' + user.role) || user.role}</p>
          </div>
        </div>
        
        {/* Settings button moved here */}
        {menuItems.find(item => item.id === 'settings') && (
          <button 
            className={`nav-item-academic ${activeView === 'settings' ? "active" : ""}`}
            onClick={() => setView('settings')}
            style={{ marginBottom: '8px', borderRadius: '8px' }}
          >
            {menuItems.find(item => item.id === 'settings').label}
          </button>
        )}

        <button onClick={onLogout} className="btn-logout-sidebar">
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
