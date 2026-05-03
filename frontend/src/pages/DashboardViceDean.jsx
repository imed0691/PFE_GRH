import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageClasses from './ManageClasses';
import ManageAbsences from './ManageAbsences';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import ReminderInbox from './ReminderInbox';
import useNotificationBadges from '../hooks/useNotificationBadges';
import Settings from './Settings';

function DashboardViceDean({ user, onLogout }) {
  const [stats, setStats] = useState({ total_teachers: 0, pending_absences: 0 });
  const [view, setViewRaw] = useState(localStorage.getItem('vicedean_dashboard_view') || 'overview');
  const { badges, markSeen } = useNotificationBadges();
  const { t } = useLanguage();
  const lastClearedView = useRef(null);

  const handleProfileUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  const setView = (newView) => { 
    setViewRaw(newView); 
    localStorage.setItem('vicedean_dashboard_view', newView);
    if (badges[newView] && badges[newView] > 0) markSeen(newView); 
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.ok ? await res.json() : [];
      const absencesRes = await fetch('http://localhost:5000/api/absences', { headers: { 'Authorization': `Bearer ${token}` } });
      const absences = await absencesRes.ok ? await absencesRes.json() : [];
      
      setStats({
        total_teachers: data.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length,
        pending_absences: absences.filter(a => a.justification_status === 'Pending').length
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchStats();
    if (badges[view] > 0) markSeen(view);
  }, []);

  useEffect(() => {
    if (view !== lastClearedView.current && badges[view] > 0) {
      markSeen(view);
      lastClearedView.current = view;
    }
  }, [view, badges[view]]);

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview'), icon: '📊' },
    { id: 'classes', label: t('sidebar.classes'), icon: '🏫' }, 
    { id: 'absences', label: t('sidebar.absences'), icon: '⚠️', badge: badges.absences },
    { id: 'promotions', label: t('sidebar.promotions'), icon: '📈', badge: badges.promotions },
    { id: 'documents', label: t('sidebar.documents'), icon: '📄', badge: badges.documents },
    { id: 'evaluations', label: t('sidebar.evaluations'), icon: '⭐', badge: badges.evaluations },
    { id: 'reminders', label: t('sidebar.notifications'), icon: '🔔', badge: badges.reminders },
    { id: 'settings', label: t('settings.title'), icon: '⚙️' },
  ];

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={setView}
      menuItems={menuItems}
      onLogout={onLogout}
      title={view === 'settings' ? t('settings.title') : 'Vice Dean Dashboard'}
    >
      <div className="animate-academic">
        {view === 'classes' ? <ManageClasses /> :
         view === 'absences' ? <ManageAbsences user={user} /> : 
         view === 'promotions' ? <ManagePromotions user={user} /> : 
         view === 'documents' ? <ManageDocuments user={user} /> : 
         view === 'evaluations' ? <ManageEvaluations user={user} /> : 
         view === 'reminders' ? <ReminderInbox user={user} /> : 
         view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
           <div className="vicedean-view">
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '40px' }}>
                <div className="card-academic">
                  <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Faculty Staff</h4>
                  <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--navy)' }}>{stats.total_teachers}</p>
                </div>
                <div className="card-academic">
                  <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Pending Validations</h4>
                  <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--gold)' }}>{stats.pending_absences}</p>
                </div>
              </div>
              <div className="card-academic">
                <h3 className="academic-title">Vice Dean Administrative Portal</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.8' }}>
                  Assisting in the management of faculty affairs, academic tracking, and staff evaluations. 
                  Please use the navigation menu to process pending requests and monitor institutional performance.
                </p>
              </div>
           </div>
         )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardViceDean;
