import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './NotificationFeed.css';

const typeConfig = {
  evaluation: { color: '#f59e0b' },
  absence: { color: '#ef4444' },
  promotion: { color: '#8b5cf6' },
  recruitment: { color: '#0ea5e9' },
  document: { color: '#10b981' },
  research: { color: '#6366f1' },
};

function NotificationFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/feed', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setItems(await res.json()); } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchFeed();
  }, []);

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return t('feed.justNow');
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('feed.mAgo')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('feed.hAgo')}`;
    return `${Math.floor(seconds / 86400)}${t('feed.dAgo')}`;
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter);
  const types = Object.keys(typeConfig);

  return (
    <div className="feed-container">
      <div className="feed-filters">
        <button className={`feed-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('common.all')}</button>
        {types.map(ty => (
          <button key={ty} className={`feed-filter-btn ${filter === ty ? 'active' : ''}`} onClick={() => setFilter(ty)}>{t('feed.' + ty)}</button>
        ))}
      </div>
      {loading ? <div className="feed-loading">{t('feed.loadingActivity')}</div> : filteredItems.length === 0 ? <div className="feed-empty">{t('feed.noActivity')}</div> : (
        <div className="feed-list">
          {filteredItems.map((item, index) => (
            <div key={index} className="feed-item" style={{ '--accent-color': typeConfig[item.type]?.color || '#64748b', animationDelay: `${index * 0.05}s` }}>
              <div className="feed-item-icon" style={{ background: typeConfig[item.type]?.color }}></div>
              <div className="feed-item-content"><div className="feed-item-title">{item.title}</div><div className="feed-item-desc">{item.description}</div></div>
              <div className="feed-item-time">{timeAgo(item.date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationFeed;
