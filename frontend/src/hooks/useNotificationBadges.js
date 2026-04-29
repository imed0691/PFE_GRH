import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer les badges de notification sur les menus
 * Récupère le nombre de nouveaux éléments par section et les marque comme vus
 */
function useNotificationBadges() {
  const [badges, setBadges] = useState({});

  const fetchBadges = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notifications/counts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      }
    } catch (e) {
      console.error('Error fetching notification badges:', e);
    }
  }, []);

  const markSeen = useCallback(async (section) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/seen/${section}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Clear badge locally
      setBadges(prev => ({ ...prev, [section]: 0 }));
    } catch (e) {
      console.error('Error marking section as seen:', e);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchBadges]);

  return { badges, markSeen, fetchBadges };
}

export default useNotificationBadges;
