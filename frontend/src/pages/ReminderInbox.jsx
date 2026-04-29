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
    <div className="table-card" style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>{t('teacher.communicationsFromHR') || 'Inbox / Communications'}</h3>
        {reminders.length > 0 && (
          <button onClick={() => setShowClearAllModal(true)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            {t('teacher.clearAll') || 'Clear All'}
          </button>
        )}
      </div>
      {reminders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reminders.map(r => (
            <div key={r.id} style={{ padding: '15px 20px', borderRadius: '8px', borderLeft: `4px solid ${r.type === 'error' ? '#ef4444' : r.type === 'warning' ? '#f59e0b' : '#3b82f6'}`, background: r.type === 'error' ? '#fef2f2' : r.type === 'warning' ? '#fffbeb' : '#eff6ff' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: r.type === 'error' ? '#991b1b' : r.type === 'warning' ? '#92400e' : '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span>{r.type === 'error' ? (t('teacher.urgent') || 'Urgent') : r.type === 'warning' ? (t('teacher.important') || 'Important') : (t('teacher.information') || 'Info')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '0.85em', fontWeight: 'normal', color: '#64748b' }}>
                    {t('common.from') || 'From'}: {r.sender_prenom} {r.sender_nom} ({r.sender_role})
                  </span>
                  <button onClick={() => handleDeleteReminder(r.id)} className="btn-delete-icon" title={t('common.delete')}>✕</button>
                </div>
              </div>
              <div style={{ color: '#334155', lineHeight: '1.5' }}>{r.message || r.text}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>{t('teacher.noReminders') || 'No communications'}</div>
      )}

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
