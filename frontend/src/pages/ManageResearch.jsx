import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';

function ManageResearch({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Publication');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const { t } = useLanguage();

  const fetchActivities = async () => {
    setLoading(true);
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/research', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setActivities(await res.json()); } catch (error) { toast.error(t('research.errorLoading')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title, type, description, link }) });
      if (res.ok) { toast.success(t('research.recorded')); setTitle(''); setDescription(''); setLink(''); fetchActivities(); } else { toast.error(t('research.errorRecording')); }
    } catch (error) { toast.error(t('common.serverError')); }
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>{t('research.title')}</h3>
      {isTeacher && (
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>{t('research.recordNew')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('research.activityTitle')}</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder={t('research.titlePlaceholder')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
            <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('research.type')}</label><select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="Publication">{t('research.publication')}</option><option value="Conference">{t('research.conference')}</option><option value="Project">{t('research.project')}</option><option value="Award">{t('research.award')}</option></select></div>
          </div>
          <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('research.description')}</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder={t('research.descPlaceholder')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}></textarea></div>
          <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t('research.link')}</label><input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} /></div>
          <button type="submit" className="btn-submit" style={{ background: '#8b5cf6' }}>{t('research.recordActivity')}</button>
        </form>
      )}
      {loading ? <div className="loading-spinner">{t('research.loadingActivities')}</div> : (
        <table className="modern-table">
          <thead><tr><th>#</th><th>{t('research.activityTitle')}</th><th>{t('research.type')}</th>{!isTeacher && <th>{t('common.teacher')}</th>}<th>{t('research.details')}</th><th>{t('common.date')}</th></tr></thead>
          <tbody>
            {activities.map((a, index) => (
              <tr key={a.id}>
                <td>{index + 1}</td>
                <td><strong>{a.title}</strong></td>
                <td><span className="role-tag" style={{ background: a.type === 'Publication' ? '#dbeafe' : a.type === 'Conference' ? '#fef3c7' : a.type === 'Award' ? '#fce7f3' : '#d1fae5', color: a.type === 'Publication' ? '#1e40af' : a.type === 'Conference' ? '#92400e' : a.type === 'Award' ? '#9d174d' : '#065f46' }}>{a.type}</span></td>
                {!isTeacher && <td>{a.nom} {a.prenom}</td>}
                <td style={{ maxWidth: '300px', wordBreak: 'break-word', fontSize: '13px' }}>{a.description}{a.link && <div><a href={a.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '12px' }}>{t('research.view')}</a></div>}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {activities.length === 0 && <tr><td colSpan={isTeacher ? 5 : 6} className="empty-state">{t('research.noActivities')}</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageResearch;
