import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

function ReminderInbox({ user }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useLanguage();
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reminders/teacher/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReminders(await res.json());
      }
    } catch (error) {
      toast.error(t('teacher.errorLoadingReminders') || 'Error loading communications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDeleteReminder = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reminders/${id}/hide`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        toast.success(t('teacher.reminderDeleted') || 'Deleted');
      }
    } catch (error) {
      toast.error(t('teacher.errorDeletingReminder') || 'Error deleting');
    }
  };

  const handleClearAllReminders = async () => {
    setShowClearAllModal(false);
    if (reminders.length === 0) return;
    const allIds = reminders.map(r => r.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reminders/hide-all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reminderIds: allIds })
      });
      if (res.ok) {
        setReminders([]);
        toast.success(t('teacher.allRemindersCleared') || 'Cleared');
      }
    } catch (error) {
      toast.error(t('teacher.errorClearingReminders') || 'Error');
    }
  };

  return (
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{t('teacher.communicationsFromHR') || 'Boîte de Réception'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '4px 0 0 0', fontWeight: '500' }}>{t('teacher.manageInboxDesc') || 'Consultez les annonces officielles et les messages administratifs.'}</p>
          </div>
          {reminders.length > 0 && (
            <button 
              onClick={() => setShowClearAllModal(true)} 
              className="btn-delete-pro" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>{t('teacher.clearAll') || 'TOUT EFFACER'}</span>
            </button>
          )}
        </div>

        {reminders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reminders.map(r => (
              <div 
                key={r.id} 
                className={`table-row-animate ${r.type === 'official' ? 'official-note' : ''}`} 
                style={{ 
                  padding: '24px', 
                  borderRadius: '20px', 
                  border: r.type === 'official' ? '2px solid var(--p-indigo)' : '1px solid #e2e8f0', 
                  background: r.type === 'error' ? '#fff1f2' : r.type === 'warning' ? '#fffbeb' : r.type === 'official' ? 'linear-gradient(135deg, #fcfdfe, #f8fafc)' : 'white',
                  position: 'relative',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                }}
              >
                {r.type === 'official' && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--p-indigo)', color: 'white', fontSize: '10px', padding: '6px 16px', fontWeight: '900', textTransform: 'uppercase', borderRadius: '0 18px 0 18px', letterSpacing: '0.05em' }}>
                    {t('teacher.official')}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: r.type === 'error' ? '#fecdd3' : r.type === 'warning' ? '#fef3c7' : r.type === 'official' ? 'rgba(99, 102, 241, 0.1)' : '#e0e7ff',
                      color: r.type === 'error' ? '#e11d48' : r.type === 'warning' ? '#d97706' : 'var(--p-indigo)'
                    }}>
                      {r.type === 'error' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      ) : r.type === 'warning' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {r.type === 'error' ? t('teacher.urgent') : r.type === 'warning' ? t('teacher.important') : r.type === 'official' ? t('teacher.official') : t('teacher.information')}
                      </div>
                      <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>
                        {r.sender_prenom} {r.sender_nom} <span style={{ color: '#94a3b8', fontWeight: '600' }}>• {r.sender_role}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                    </span>
                    <button 
                      onClick={() => handleDeleteReminder(r.id)} 
                      style={{ background: 'white', border: '1px solid #e2e8f0', color: '#94a3b8', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} 
                      className="hover-danger"
                      title={t('common.delete')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>

                <div style={{ 
                  color: '#334155', 
                  lineHeight: '1.7', 
                  fontSize: '15px', 
                  fontWeight: r.type === 'official' ? '700' : '500',
                  paddingLeft: '52px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {r.message || r.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '100px 32px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
             <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--p-indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
             </div>
             <h4 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '18px' }}>{t('teacher.noRemindersTitle')}</h4>
             <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>{t('teacher.noReminders')}</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showClearAllModal}
        message={t('common.confirm')}
        onConfirm={handleClearAllReminders}
        onCancel={() => setShowClearAllModal(false)}
      />
    </div>
  );
}

export default ReminderInbox;
