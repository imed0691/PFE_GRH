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
    // 1. Optimistic Update: Clear locally first for instant feedback
    setBadges(prev => {
      const next = { ...prev, [section]: 0 };
      // If viewing absences, also clear reminders badge as they are synced in backend
      if (section === 'absences') next.reminders = 0;
      return next;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/notifications/seen/${section}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Just to be safe, fetch fresh counts after a small delay
        setTimeout(fetchBadges, 2000);
      }
    } catch (e) {
      console.error('Error marking section as seen:', e);
    }
  }, [fetchBadges]);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchBadges]);

  return { badges, markSeen, fetchBadges };
}

export default useNotificationBadges;
