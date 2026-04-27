/**
 * Badge de notification rouge pour les menus latéraux
 * S'affiche uniquement si count > 0
 */
function NotifBadge({ count }) {
  if (!count || count <= 0) return null;
  
  return (
    <span style={{
      background: '#ef4444',
      color: 'white',
      borderRadius: '50%',
      padding: '2px 7px',
      fontSize: '10px',
      fontWeight: '700',
      marginLeft: 'auto',
      minWidth: '18px',
      textAlign: 'center',
      lineHeight: '14px',
      animation: 'badgePulse 2s ease-in-out infinite',
      boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)'
    }}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default NotifBadge;
