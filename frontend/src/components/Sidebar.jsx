import { useLanguage } from "../i18n/LanguageContext";
import "./Sidebar.css";

function Sidebar({ user, activeView, setView, menuItems, onLogout, isOpen }) {
  const { t } = useLanguage();

  return (
    <aside className={`sidebar-academic ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header-academic">
        <h1 className="brand-academic-title">UNIVERSITY</h1>
        <p className="brand-academic-subtitle">Management Portal</p>
      </div>

      <nav className="sidebar-nav-academic">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item-academic ${activeView === item.id ? "active" : ""}`}
            onClick={() => setView(item.id)}
          >
            {/* Emojis removed as requested for a cleaner Pro look */}
            <span style={{ flex: 1, textAlign: 'center' }}>{item.label}</span>
            <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
              {item.badge > 0 && (
                <span className="sidebar-badge-academic">
                  {item.badge}
                </span>
              )}
            </div>
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
        <button onClick={onLogout} className="btn-logout-sidebar">
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
