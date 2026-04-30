import { useLanguage } from "../i18n/LanguageContext";
import "./Sidebar.css";

function Sidebar({ user, activeView, setView, menuItems, onLogout }) {
  const { t } = useLanguage();

  return (
    <aside className="sidebar-academic">
      <div className="sidebar-header">
        <h2 className="outfit">HRM PRO</h2>
      </div>

      <nav className="sidebar-nav-academic">
        {menuItems.map((item) => (
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
        <button onClick={onLogout} className="btn-logout-sidebar">
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
