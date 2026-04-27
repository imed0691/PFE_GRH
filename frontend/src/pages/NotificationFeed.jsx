import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const typeConfig = {
  evaluation: { icon: '⭐', color: '#f59e0b', bg: '#fffbeb', label: 'Evaluation' },
  absence:    { icon: '🏖️', color: '#ef4444', bg: '#fef2f2', label: 'Absence' },
  promotion:  { icon: '📈', color: '#8b5cf6', bg: '#f5f3ff', label: 'Promotion' },
  recruitment:{ icon: '🤝', color: '#0ea5e9', bg: '#f0f9ff', label: 'Recruitment' },
  document:   { icon: '📄', color: '#10b981', bg: '#ecfdf5', label: 'Document' },
  research:   { icon: '🔬', color: '#6366f1', bg: '#eef2ff', label: 'Research' },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFeed(await res.json());
      }
    } catch (error) {
      toast.error('Error loading feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const filteredFeed = filter === 'all' ? feed : feed.filter(f => f.type === filter);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Filter chips */}
      <div style={{ 
        display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap',
        padding: '16px 20px', background: 'white', borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
            background: filter === 'all' ? '#0f172a' : '#f1f5f9',
            color: filter === 'all' ? 'white' : '#64748b'
          }}
        >
          All
        </button>
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
              background: filter === key ? cfg.color : '#f1f5f9',
              color: filter === key ? 'white' : '#64748b'
            }}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          Loading activity...
        </div>
      ) : filteredFeed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
          No activity found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredFeed.map((item, idx) => {
            const cfg = typeConfig[item.type] || typeConfig.document;
            return (
              <div
                key={`${item.type}-${item.id}-${idx}`}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  animation: `feedSlideIn 0.4s ease ${idx * 0.05}s both`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Icon circle */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: cfg.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                    border: `2px solid ${cfg.color}20`
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                        letterSpacing: '0.5px', color: cfg.color,
                        background: cfg.bg, padding: '2px 10px', borderRadius: '10px'
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {timeAgo(item.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                      {item.actor_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                      {item.description}
                    </div>

                    {item.detail && (
                      <div style={{
                        marginTop: '10px', padding: '10px 14px',
                        background: '#f8fafc', borderRadius: '10px',
                        borderLeft: `3px solid ${cfg.color}`,
                        fontSize: '12px', color: '#64748b',
                        fontStyle: 'italic', lineHeight: '1.5',
                        maxWidth: '100%', wordBreak: 'break-word'
                      }}>
                        "{item.detail.length > 120 ? item.detail.substring(0, 120) + '...' : item.detail}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationFeed;
