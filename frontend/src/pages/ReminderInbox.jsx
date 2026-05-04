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

  if (loading && reminders.length === 0) return <div className="loading-spinner">{t('common.loading')}</div>;

  return (
    <>
      <div className="card-academic" style={{ margin: 0, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>{t('teacher.communicationsFromHR') || 'Inbox / Communications'}</h3>
          {reminders.length > 0 && (
            <button onClick={() => setShowClearAllModal(true)} className="btn-delete-pro" style={{ padding: '6px 12px', fontSize: '11px' }}>
              {t('teacher.clearAll') || 'Clear All'}
            </button>
          )}
        </div>
        {reminders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {reminders.map(r => (
              <div key={r.id} className={`reminder-item-pro ${r.type === 'official' ? 'official-note' : ''}`} style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                border: r.type === 'official' ? '2px solid #818cf8' : '1px solid var(--border-soft)', 
                background: r.type === 'error' ? '#fff1f2' : r.type === 'warning' ? '#fffbeb' : r.type === 'official' ? 'linear-gradient(to right, #fcfdfe, #f8fafc)' : '#f8fafc',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {r.type === 'official' && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#818cf8', color: 'white', fontSize: '9px', padding: '4px 12px', fontWeight: '900', textTransform: 'uppercase', borderRadius: '0 0 0 12px' }}>
                    Note de Service
                  </div>
                )}
                <div style={{ fontWeight: '800', marginBottom: '8px', color: r.type === 'error' ? '#e11d48' : r.type === 'warning' ? '#92400e' : r.type === 'official' ? '#4338ca' : '#6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>
                      {r.type === 'error' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      ) : r.type === 'warning' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      ) : r.type === 'official' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      )}
                      {r.type === 'error' ? (t('teacher.urgent') || 'Urgent') : r.type === 'warning' ? (t('teacher.important') || 'Important') : r.type === 'official' ? 'Official Note' : (t('teacher.information') || 'Info')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: '600', color: '#64748b' }}>
                      {t('common.from') || 'From'}: {r.sender_prenom} {r.sender_nom} ({r.sender_role})
                    </span>
                    <button onClick={() => handleDeleteReminder(r.id)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={t('common.delete')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
                <div style={{ color: '#334155', lineHeight: '1.6', fontSize: '14px', fontWeight: r.type === 'official' ? '700' : '500' }}>{r.message || r.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px 30px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
             <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
             </div>
             {t('teacher.noReminders') || 'No communications'}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showClearAllModal}
        message={t('common.confirm')}
        onConfirm={handleClearAllReminders}
        onCancel={() => setShowClearAllModal(false)}
      />
    </>
  );
}

export default ReminderInbox;
