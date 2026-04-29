import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageAbsences from './ManageAbsences';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import ReminderInbox from './ReminderInbox';
import useNotificationBadges from '../hooks/useNotificationBadges';
import Settings from './Settings';

function DashboardViceRector({ user, onLogout }) {
  const [view, setViewRaw] = useState(localStorage.getItem('vicerector_dashboard_view') || 'overview');
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
    localStorage.setItem('vicerector_dashboard_view', newView);
    if (badges[newView] && badges[newView] > 0) markSeen(newView); 
  };

  useEffect(() => {
    if (view !== lastClearedView.current && badges[view] > 0) {
      markSeen(view);
      lastClearedView.current = view;
    }
  }, [view, badges[view]]);

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview'), icon: '🏛️' },
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
      title={view === 'settings' ? t('settings.title') : 'Vice Rector Dashboard'}
    >
      <div className="animate-academic">
        {view === 'absences' ? <ManageAbsences user={user} /> : 
         view === 'promotions' ? <ManagePromotions user={user} /> : 
         view === 'documents' ? <ManageDocuments user={user} /> : 
         view === 'evaluations' ? <ManageEvaluations user={user} /> : 
         view === 'reminders' ? <ReminderInbox user={user} /> : 
         view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
           <div className="vicerector-view">
              <div className="card-academic">
                <h3 className="academic-title">Vice Rector Executive Office</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '18px', lineHeight: '1.8' }}>
                  Overseeing institutional strategy, faculty development, and academic quality assurance. 
                  Access critical management modules via the executive sidebar to ensure institutional excellence.
                </p>
                <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                   <button className="btn-academic">Institutional Strategy</button>
                   <button className="btn-academic btn-academic-outline">Quality Reports</button>
                </div>
              </div>
           </div>
         )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardViceRector;
