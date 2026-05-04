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
    <div className="communication-center animate-mnadm">
      <div className="card-academic" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="comm-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--border-soft)' }}>
          <div className="icon-badge-pro bg-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
          </div>
          <div>
            <h2 className="academic-title" style={{ fontSize: '20px', margin: 0 }}>Faculty Communication Center</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>Send official announcements and targeted reminders</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="premium-form">
          <div className="mnadm-form-row">
            <div className="mnadm-form-group">
              <label className="mnadm-label">Recipient Scope</label>
              <select className="mnadm-input" value={targetCategory} onChange={handleCategoryChange}>
                <option value="all">Faculty-Wide Broadcast (All Staff)</option>
                <option value="dept_head">Specific Department Head</option>
                <option value="teacher">Specific Teacher</option>
              </select>
            </div>

            <div className="mnadm-form-group">
              <label className="mnadm-label">Message Priority</label>
              <select className="mnadm-input" name="type" value={formData.type} onChange={handleChange}>
                <option value="info">General Information</option>
                <option value="warning">Important Notice</option>
                <option value="error">Urgent Directive</option>
                <option value="official">Official Note (Note de Service)</option>
              </select>
            </div>
          </div>

          {targetCategory !== 'all' && (
            <div className="mnadm-form-row animate-mnadm">
              <div className="mnadm-form-group">
                <label className="mnadm-label">Filter by Department</label>
                <select className="mnadm-input" value={filterDeptId} onChange={(e) => setFilterDeptId(e.target.value)}>
                  <option value="">-- All Departments --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="mnadm-form-group">
                <label className="mnadm-label">Select Recipient</label>
                <Select
                  options={filteredOptions}
                  onChange={handleSelectChange}
                  placeholder={`Search...`}
                  isClearable
                  isSearchable
                  value={filteredOptions.find(o => o.value === formData.recipient_id) || null}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '44px',
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      boxShadow: 'none',
                      '&:hover': { borderColor: 'var(--p-indigo)' }
                    }),
                    menu: (base) => ({ ...base, borderRadius: '12px', overflow: 'hidden' })
                  }}
                />
              </div>
            </div>
          )}

          <div className="mnadm-form-group" style={{ marginTop: '24px' }}>
            <label className="mnadm-label">Message Content</label>
            <textarea 
              name="message" 
              className="mnadm-input"
              value={formData.message} 
              onChange={handleChange} 
              required 
              rows="6" 
              placeholder={formData.type === 'official' ? "Write the official Note de Service content here..." : "Type your message here..."}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-confirm-pro"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 32px' }}
            >
              {loading ? 'Sending...' : (
                <>
                  <span>Send Broadcast</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
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
