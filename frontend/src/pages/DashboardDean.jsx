import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageAbsences from './ManageAbsences';
import ManagePromotions from './ManagePromotions';
import ManageDocuments from './ManageDocuments';
import ManageEvaluations from './ManageEvaluations';
import ManageReminders from './ManageReminders';
import ReminderInbox from './ReminderInbox';
import useNotificationBadges from '../hooks/useNotificationBadges';
import Settings from './Settings';
import './DashboardDean.css';

function DashboardDean({ user, onLogout }) {
  const [stats, setStats] = useState({ total_teachers: 0, total_departments: 0 });
  const [view, setViewRaw] = useState(localStorage.getItem('dean_dashboard_view') || 'overview');
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
    localStorage.setItem('dean_dashboard_view', newView);
    if (badges[newView] && badges[newView] > 0) markSeen(newView); 
  };

  const fetchDeanStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setStats({
          total_teachers: data.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length,
          total_departments: [...new Set(data.map(u => u.department_name).filter(Boolean))].length
        });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchDeanStats(); 
    if (badges[view] > 0) markSeen(view);
  }, []);

  useEffect(() => {
    if (view !== lastClearedView.current && badges[view] > 0) {
      markSeen(view);
      lastClearedView.current = view;
    }
  }, [view, badges[view]]);

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview') },
    { id: 'absences', label: t('sidebar.absences'), badge: badges.absences },
    { id: 'promotions', label: t('sidebar.promotions'), badge: badges.promotions },
    { id: 'documents', label: t('sidebar.documents'), badge: badges.documents },
    { id: 'evaluations', label: t('sidebar.evaluations'), badge: badges.evaluations },
    { id: 'reminders', label: t('sidebar.notifications'), badge: badges.reminders },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'overview': return t('topbar.facultyOverview');
      case 'absences': return t('topbar.absenceTracking');
      case 'promotions': return t('topbar.academicPromotions');
      case 'documents': return t('topbar.officialDocuments');
      case 'evaluations': return t('topbar.teachingQuality');
      case 'reminders': return t('topbar.officialCommunications');
      case 'settings': return t('settings.title');
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={setView}
      menuItems={menuItems}
      onLogout={onLogout}
      title={getPageTitle()}
    >
      <div className="animate-academic">
        {view === 'absences' ? <ManageAbsences user={user} /> : 
         view === 'promotions' ? <ManagePromotions user={user} /> : 
         view === 'documents' ? <ManageDocuments user={user} /> : 
         view === 'evaluations' ? <ManageEvaluations user={user} /> : 
         view === 'reminders' ? <ManageReminders user={user} /> : 
         view === 'settings' ? <Settings user={user} onProfileUpdate={handleProfileUpdate} /> : (
           <div className="dean-view">
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '40px' }}>
                <div className="card-academic">
                  <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>{t('dean.facultyStrength')}</h4>
                  <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--navy)' }}>{stats.total_teachers}</p>
                </div>
                <div className="card-academic">
                  <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>{t('dean.activeDepts')}</h4>
                  <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--navy)' }}>{stats.total_departments}</p>
                </div>
              </div>

              <div className="card-academic">
                <h3 className="academic-title">{t('dean.adminHighlights')}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.8' }}>
                  {t('dean.welcomeText')}
                </p>
                <div style={{ marginTop: '32px', display: 'flex', gap: '20px' }}>
                   <button className="btn-confirm-pro" onClick={() => setView('evaluations')} style={{ padding: '10px 24px' }}>{t('dean.reviewEvals')}</button>
                   <button className="btn-cancel-pro" onClick={() => setView('promotions')} style={{ padding: '10px 24px' }}>{t('dean.careerTracking')}</button>
                </div>
              </div>
           </div>
         )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardDean;
