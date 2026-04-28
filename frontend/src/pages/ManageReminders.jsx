import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

function ManageReminders() {
  const [recipientType, setRecipientType] = useState('all');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [teachers, setTeachers] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [filterDeptId, setFilterDeptId] = useState('');
  const [sending, setSending] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try { const token = localStorage.getItem('token');
        const [resUsers, resDepts] = await Promise.all([fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${token}` } }), fetch('http://localhost:5000/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })]);
        if (resUsers.ok) { const users = await resUsers.json(); setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT')); setDeptHeads(users.filter(u => u.role === 'DEPARTMENT_HEAD' || u.role === 'CHEF_DEPARTEMENT')); }
        if (resDepts.ok) setDepartments(await resDepts.json());
      } catch (error) { toast.error(t('reminders.errorLoadingData')); }
    };
    fetchData();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return toast.error(t('reminders.messageRequired'));
    setSending(true);
    try { const token = localStorage.getItem('token'); const body = { text: message, type, recipient_type: recipientType };
      if (recipientType === 'head' || recipientType === 'teacher') { body.recipient_id = selectedRecipientId; }
      const res = await fetch('http://localhost:5000/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { toast.success(t('reminders.sent')); setMessage(''); setSelectedRecipientId(null); } else { toast.error(t('reminders.errorSending')); }
    } catch (error) { toast.error(t('common.serverError')); } finally { setSending(false); }
  };

  const filteredTeachers = filterDeptId ? teachers.filter(t2 => String(t2.department_id) === String(filterDeptId)) : teachers;
  const filteredHeads = filterDeptId ? deptHeads.filter(h => String(h.department_id) === String(filterDeptId)) : deptHeads;

  const teacherOptions = filteredTeachers.map(t2 => ({ value: t2.id, label: `${t2.nom} ${t2.prenom}` }));
  const headOptions = filteredHeads.map(h => ({ value: h.id, label: `${h.nom} ${h.prenom}` }));

  return (
    <div className="table-card" style={{ padding: '25px', maxWidth: '700px', margin: '0 auto' }}>
      <h3 style={{ marginTop: 0, marginBottom: '25px' }}>{t('reminders.sendReminder')}</h3>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{t('reminders.recipientCategory')}</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[['all', t('reminders.allStaff')], ['head', t('reminders.specificDeptHead')], ['teacher', t('reminders.specificTeacher')]].map(([val, label]) => (
            <button key={val} onClick={() => { setRecipientType(val); setSelectedRecipientId(null); }} style={{ padding: '8px 16px', borderRadius: '20px', border: recipientType === val ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: recipientType === val ? '#eff6ff' : 'white', color: recipientType === val ? '#1d4ed8' : '#64748b', cursor: 'pointer', fontWeight: recipientType === val ? 'bold' : 'normal' }}>{label}</button>
          ))}
        </div>
      </div>
      {(recipientType === 'head' || recipientType === 'teacher') && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{t('reminders.filterByDept')}</label>
          <select value={filterDeptId} onChange={e => { setFilterDeptId(e.target.value); setSelectedRecipientId(null); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">{t('reminders.allDepartments')}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}
      {recipientType === 'head' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{t('reminders.selectDeptHead')}</label>
          <Select options={headOptions} value={headOptions.find(o => o.value === selectedRecipientId)} onChange={o => setSelectedRecipientId(o?.value)} placeholder={t('reminders.searchHead')} isClearable isSearchable />
        </div>
      )}
      {recipientType === 'teacher' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{t('reminders.selectTeacher')}</label>
          <Select options={teacherOptions} value={teacherOptions.find(o => o.value === selectedRecipientId)} onChange={o => setSelectedRecipientId(o?.value)} placeholder={t('reminders.searchTeacher')} isClearable isSearchable />
        </div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{t('reminders.reminderType')}</label>
        <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <option value="info">{t('reminders.infoBlue')}</option>
          <option value="warning">{t('reminders.warningOrange')}</option>
          <option value="error">{t('reminders.urgentRed')}</option>
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{t('reminders.message')}</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows="4" placeholder={t('reminders.messagePlaceholder')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }} />
      </div>
      <button onClick={handleSend} disabled={sending} style={{ width: '100%', padding: '12px', background: sending ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>{sending ? t('reminders.sending') : t('reminders.sendBtn')}</button>
    </div>
  );
}

export default ManageReminders;
