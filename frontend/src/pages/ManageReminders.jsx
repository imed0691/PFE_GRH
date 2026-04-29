import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';
import ReminderInbox from './ReminderInbox';

function ManageReminders({ user }) {
  const [recipientType, setRecipientType] = useState('all');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [teachers, setTeachers] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [deans, setDeans] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [sending, setSending] = useState(false);
  const { t } = useLanguage();

  const isDeptHead = user?.role === 'DEPARTMENT_HEAD' || user?.role === 'CHEF_DEPARTEMENT';
  const isRector = user?.role === 'RECTOR' || user?.role === 'RECTEUR' || user?.role === 'VICE_RECTOR' || user?.role === 'VICE_RECTEUR';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [resUsers, resDepts] = await Promise.all([
          fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (resUsers.ok) { 
          const users = await resUsers.json(); 
          if (isDeptHead) {
            setTeachers(users.filter(u => (u.role === 'TEACHER' || u.role === 'ENSEIGNANT') && u.department_id === user.department_id));
          } else {
            setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT'));
            setDeptHeads(users.filter(u => u.role === 'DEPARTMENT_HEAD' || u.role === 'CHEF_DEPARTEMENT')); 
            setDeans(users.filter(u => u.role === 'DEAN' || u.role === 'DOYEN' || u.role === 'VICE_DEAN' || u.role === 'VICE_DOYEN'));
          }
        }
        if (resDepts.ok) setDepartments(await resDepts.json());
      } catch (error) { toast.error(t('reminders.errorLoadingData')); }
    };
    fetchData();
  }, [user]);

  const handleSend = async () => {
    if (!message.trim()) return toast.error(t('reminders.messageRequired'));
    setSending(true);
    try { 
      const token = localStorage.getItem('token'); 
      const body = { text: message, type, recipient_type: (recipientType === 'all' && isDeptHead) ? 'dept' : recipientType };
      if (['head', 'teacher', 'dean'].includes(recipientType)) body.recipient_id = selectedRecipientId;
      
      const res = await fetch('http://localhost:5000/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { 
        toast.success(t('reminders.sent')); 
        setMessage(''); 
        setSelectedRecipientId(null);
      } else { toast.error(t('reminders.errorSending')); }
    } catch (error) { toast.error(t('common.serverError')); } finally { setSending(false); }
  };

  const teacherOptions = teachers.map(t2 => ({ value: t2.id, label: `${t2.nom} ${t2.prenom}` }));
  const headOptions = deptHeads.map(h => ({ value: h.id, label: `${h.nom} ${h.prenom}` }));
  const deanOptions = deans.map(d => ({ value: d.id, label: `${d.nom} ${d.prenom} (${d.role})` }));

  const recipientCategories = isRector 
    ? [['all', t('reminders.allStaff')], ['dean', t('reminders.specificDean')], ['head', t('reminders.specificDeptHead')], ['teacher', t('reminders.specificTeacher')]]
    : isDeptHead 
      ? [['all', t('reminders.allMyTeachers')], ['teacher', t('reminders.specificTeacher')]]
      : [['all', t('reminders.allStaff')], ['head', t('reminders.specificDeptHead')], ['teacher', t('reminders.specificTeacher')]];

  return (
    <div className="content-area">

      {/* TWO COLUMN ALIGNED LAYOUT */}
      <div className="grid-responsive" style={{ gap: '30px', alignItems: 'start' }}>
        
        {/* FORM CARD */}
        <div className="table-card" style={{ padding: '32px', margin: 0, height: '100%' }}>
          <div className="card-header" style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '24px' }}>{t('reminders.sendReminder')}</h3>
            <p>{t('reminders.subtitle') || 'Communiquez avec votre équipe instantanément.'}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>{t('reminders.recipientCategory')}</label>
              <select value={recipientType} onChange={e => { setRecipientType(e.target.value); setSelectedRecipientId(null); }}>
                {recipientCategories.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {recipientType !== 'all' && (
              <div className="form-group">
                <label>
                  {recipientType === 'head' ? t('reminders.selectDeptHead') : recipientType === 'dean' ? t('reminders.selectDean') : t('reminders.selectTeacher')}
                </label>
                <Select 
                  options={recipientType === 'head' ? headOptions : recipientType === 'dean' ? deanOptions : teacherOptions} 
                  value={(recipientType === 'head' ? headOptions : recipientType === 'dean' ? deanOptions : teacherOptions).find(o => o.value === selectedRecipientId)} 
                  onChange={o => setSelectedRecipientId(o?.value)} 
                  placeholder={t('common.search')}
                  styles={{ control: (b) => ({ ...b, borderRadius: '8px', border: '1px solid var(--border)', background: '#f9fafb' }) }} 
                />
              </div>
            )}

            <div className="form-group">
              <label>{t('reminders.reminderType')}</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['info', 'warning', 'error'].map(tType => (
                  <button key={tType} onClick={() => setType(tType)} style={{ flex: 1, background: type === tType ? 'var(--p-indigo)' : 'white', color: type === tType ? 'white' : 'var(--text-main)', border: '1px solid var(--border)', padding: '10px' }}>
                    {tType.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>{t('reminders.message')}</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows="5" placeholder={t('reminders.messagePlaceholder')} />
            </div>

            <div className="form-actions">
              <button onClick={handleSend} disabled={sending} className="btn-submit" style={{ width: '100%' }}>
                {sending ? t('reminders.sending') : t('reminders.sendBtn')}
              </button>
            </div>
          </div>
        </div>

        {/* HISTORY CARD */}
        <div style={{ height: '100%', margin: 0 }}>
          <ReminderInbox user={user} />
        </div>

      </div>

    </div>
  );
}

export default ManageReminders;
