import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageSessions from './ManageSessions';
import ManageAbsences from './ManageAbsences';
import ManageReminders from './ManageReminders';
import Settings from './Settings';
import './DashboardViceDean.css';

function DashboardViceDean({ user, onLogout }) {
  const [sessionsCount, setSessionsCount] = useState(0);
  const [unreadAbsences, setUnreadAbsences] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const { t } = useLanguage();

  const [view, setView] = useState(localStorage.getItem('vicedean_view') || 'overview');
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resUsers, resSessions, resAbsences] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/absences', { headers })
      ]);

      if (resUsers.ok) {
        const users = await resUsers.json();
        setTeachersCount(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length);
      }
      if (resSessions.ok) {
        const sessions = await resSessions.json();
        setSessionsCount(sessions.length);
      }
      if (resAbsences.ok) {
        const absences = await resAbsences.json();
        const unreadCount = absences.filter(a => !a.is_read_by_admin).length;
        setUnreadAbsences(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching overview data", error);
    } finally {
      setLoading(false);
    }
  };

  const markAbsencesAsRead = async () => {
    if (unreadAbsences === 0) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/absences/read-admin', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnreadAbsences(0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('vicedean_view', newView);
    if (newView === 'absences') {
      markAbsencesAsRead();
    }
  };

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview') || 'Aperçu' },
    { id: 'sessions', label: t('sidebar.sessions') || 'Scolarité' },
    { id: 'absences', label: t('sidebar.absences') || 'Absences', badge: unreadAbsences },
    { id: 'reminders', label: t('sidebar.reminders') || 'Communications' },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'overview': return t('sidebar.overview') || 'Tableau de Bord Pédagogie';
      case 'sessions': return t('sidebar.sessions') || 'Gestion de la Scolarité';
      case 'absences': return t('sidebar.absences') || 'Suivi des Absences';
      case 'reminders': return t('sidebar.reminders') || 'Communications & Rappels';
      case 'settings': return t('settings.title');
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={handleViewChange}
      menuItems={menuItems}
      onLogout={onLogout}
      title={getPageTitle()}
    >
      <div className="animate-mnadm">
        {view === 'overview' ? (
          loading ? (
            <div className="loading-spinner-academic"></div>
          ) : (
            <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Total Teachers</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--p-indigo)', margin: 0 }}>{teachersCount}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #10b981' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Active Sessions</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: 0 }}>{sessionsCount}</p>
              </div>
              <div className="card-academic" style={{ borderTop: `4px solid ${unreadAbsences > 0 ? '#ef4444' : '#8b5cf6'}` }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>New Absences</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: unreadAbsences > 0 ? '#ef4444' : '#8b5cf6', margin: 0 }}>{unreadAbsences}</p>
              </div>
            </div>
          )
        ) : view === 'sessions' ? (
          <ManageSessions />
        ) : view === 'absences' ? (
          <ManageAbsences user={user} />
        ) : view === 'reminders' ? (
          <ManageReminders user={user} />
        ) : view === 'settings' ? (
          <Settings user={user} onProfileUpdate={() => window.location.reload()} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default DashboardViceDean;
