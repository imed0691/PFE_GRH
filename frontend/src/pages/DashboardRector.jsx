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
import './DashboardRector.css';

function DashboardRector({ user, onLogout }) {
  const [stats, setStats] = useState({ total_users: 0, total_teachers: 0, total_departments: 0 });
  const [view, setViewRaw] = useState(localStorage.getItem('rector_dashboard_view') || 'overview');
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
    localStorage.setItem('rector_dashboard_view', newView);
    if (badges[newView] && badges[newView] > 0) markSeen(newView); 
  };

  const fetchGlobalStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setStats({
          total_users: data.length,
          total_teachers: data.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length,
          total_departments: [...new Set(data.map(u => u.department_name).filter(Boolean))].length
        });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchGlobalStats(); }, []);
  
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
      case 'overview': return t('topbar.institutionalOverview');
      case 'absences': return t('topbar.absenceTracking');
      case 'promotions': return t('topbar.academicAdvancements');
      case 'documents': return t('topbar.institutionalDocuments');
      case 'evaluations': return t('topbar.academicPerformance');
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
           <div className="rector-view">
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '40px' }}>
                <div className="card-academic">
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>{t('hr.totalStaff')}</h4>
                  <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--navy)' }}>{stats.total_users}</p>
                </div>
                <div className="card-academic">
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>{t('hr.faculty')}</h4>
                  <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--navy)' }}>{stats.total_teachers}</p>
                </div>
                <div className="card-academic">
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>{t('sidebar.departments')}</h4>
                  <p style={{ fontSize: '42px', fontWeight: '800', color: 'var(--navy)' }}>{stats.total_departments}</p>
                </div>
              </div>

              <div className="card-academic">
                <h3 className="academic-title">{t('hr.summaryTitle')}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '17px', lineHeight: '1.8' }}>
                  {t('hr.summaryText')}
                </p>
                <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '32px', display: 'flex', gap: '24px' }}>
                   <div style={{ flex: 1 }}>
                      <h5 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', marginBottom: '16px' }}>{t('hr.recentActivity')}</h5>
                      <p style={{ fontSize: '14px', color: '#666' }}>{t('hr.noAlerts')}</p>
                   </div>
                   <button className="btn-academic">{t('hr.reports')}</button>
                </div>
              </div>
           </div>
         )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardRector;
