import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

function ManageReminders({ user }) {
  const [teachers, setTeachers] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { t } = useLanguage();
  
  const [targetCategory, setTargetCategory] = useState('all');
  const [filterDeptId, setFilterDeptId] = useState('');

  const [formData, setFormData] = useState({
    recipient_id: '',
    message: '',
    type: 'info',
    recipient_type: 'individual'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [resUsers, resDepts] = await Promise.all([
          fetch('http://localhost:5000/api/users', { headers }),
          fetch('http://localhost:5000/api/departments', { headers })
        ]);

        if (resUsers.ok && resDepts.ok) {
          const users = await resUsers.json();
          const depts = await resDepts.json();
          
          setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT'));
          setDeptHeads(users.filter(u => u.role === 'DEPARTMENT_HEAD' || u.role === 'CHEF_DEPARTEMENT'));
          setDepartments(depts);
        }
      } catch (error) {
        toast.error('Error loading data');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption) => {
    setFormData({ ...formData, recipient_id: selectedOption ? selectedOption.value : '' });
  };

  const handleCategoryChange = (e) => {
    setTargetCategory(e.target.value);
    setFilterDeptId('');
    setFormData({ ...formData, recipient_id: '', recipient_type: e.target.value === 'all' ? 'broadcast' : 'individual' });
  };

  let filteredOptions = [];
  if (targetCategory === 'dept_head') {
    let heads = deptHeads;
    if (filterDeptId) heads = heads.filter(h => h.department_id === parseInt(filterDeptId));
    filteredOptions = heads.map(h => ({ value: h.id, label: `${h.nom} ${h.prenom} - ${h.department_name || 'Head'}` }));
  } else if (targetCategory === 'teacher') {
    let ts = teachers;
    if (filterDeptId) ts = ts.filter(t => t.department_id === parseInt(filterDeptId));
    filteredOptions = ts.map(t => ({ value: t.id, label: `${t.nom} ${t.prenom} (${t.department_name || 'No Dept'})` }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message) return toast.error("Message is required");

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: targetCategory === 'all' ? null : formData.recipient_id,
          text: formData.message,
          type: formData.type,
          recipient_type: targetCategory === 'all' ? 'faculty' : 'individual'
        })
      });

      if (res.ok) {
        toast.success("Broadcast sent successfully");
        setFormData({ ...formData, message: '' });
      } else {
        toast.error("Error sending message");
      }
    } catch (error) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--p-indigo), #818cf8)', color: 'white', width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
          </div>
          <div>
            <h2 className="serif" style={{ fontSize: '26px', margin: 0, color: '#0f172a' }}>{t('reminders.title') || 'Centre de Communication'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '4px 0 0 0', fontWeight: '500' }}>{t('reminders.manageTitle') || 'Envoyez des annonces officielles et des rappels ciblés au corps enseignant.'}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label" style={{ fontWeight: '800' }}>{t('reminders.scope') || 'Portée de la réception'}</label>
              <select className="mnadm-input" value={targetCategory} onChange={handleCategoryChange} style={{ fontWeight: '700', borderRadius: '14px', padding: '14px' }}>
                <option value="all">{t('reminders.allFaculty') || 'Diffusion générale (Tout le personnel)'}</option>
                <option value="dept_head">{t('reminders.deptHeads') || 'Chefs de département spécifiques'}</option>
                <option value="teacher">{t('reminders.specificTeacher') || 'Enseignant spécifique'}</option>
              </select>
            </div>

            <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
              <label className="mnadm-label" style={{ fontWeight: '800' }}>{t('reminders.priority') || 'Priorité du message'}</label>
              <select className="mnadm-input" name="type" value={formData.type} onChange={handleChange} style={{ fontWeight: '700', borderRadius: '14px', padding: '14px' }}>
                <option value="info">{t('reminders.typeInfo') || 'Information générale'}</option>
                <option value="warning">{t('reminders.typeWarning') || 'Avis important'}</option>
                <option value="error">{t('reminders.typeUrgent') || 'Directive urgente'}</option>
                <option value="official">{t('reminders.typeOfficial') || 'Note de Service officielle'}</option>
              </select>
            </div>
          </div>

          {targetCategory !== 'all' && (
            <div className="animate-mnadm" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label" style={{ fontWeight: '800' }}>{t('common.department')}</label>
                <select className="mnadm-input" value={filterDeptId} onChange={(e) => setFilterDeptId(e.target.value)} style={{ fontWeight: '700', borderRadius: '14px', background: 'white' }}>
                  <option value="">-- {t('common.allDepartments') || 'Tous les départements'} --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{t('departments.' + d.name) === 'departments.' + d.name ? d.name : t('departments.' + d.name)}</option>
                  ))}
                </select>
              </div>

              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label" style={{ fontWeight: '800' }}>{t('reminders.selectRecipient') || 'Sélectionner le destinataire'}</label>
                <Select
                  options={filteredOptions}
                  onChange={handleSelectChange}
                  placeholder={t('common.search') || 'Rechercher...'}
                  isClearable
                  isSearchable
                  value={filteredOptions.find(o => o.value === formData.recipient_id) || null}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '48px',
                      borderRadius: '14px',
                      borderColor: '#e2e8f0',
                      boxShadow: 'none',
                      fontWeight: '600',
                      background: 'white',
                      '&:hover': { borderColor: 'var(--p-indigo)' }
                    }),
                    menu: (base) => ({ ...base, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' })
                  }}
                />
              </div>
            </div>
          )}

          <div className="mnadm-form-group">
            <label className="mnadm-label" style={{ fontWeight: '800' }}>{t('reminders.messageContent') || 'Contenu du message'}</label>
            <textarea 
              name="message" 
              className="mnadm-input"
              value={formData.message} 
              onChange={handleChange} 
              required 
              rows="6" 
              placeholder={formData.type === 'official' ? t('reminders.officialPlaceholder') || "Rédigez ici le contenu de la note de service..." : t('reminders.messagePlaceholder') || "Saisissez votre message ici..."}
              style={{ borderRadius: '18px', padding: '20px', fontSize: '15px', fontWeight: '500', lineHeight: '1.6', background: '#f8fafc', border: '1px solid #e2e8f0' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-confirm-pro"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 48px', borderRadius: '14px', fontSize: '16px', fontWeight: '800' }}
            >
              {loading ? t('common.sending') || 'Envoi en cours...' : (
                <>
                  <span>{t('reminders.sendBroadcast') || 'ENVOYER LA DIFFUSION'}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManageReminders;
