import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardHR.css';

function AddEmployee({ onCancel, onSuccess }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', role: 'TEACHER', department_id: '', grade: 'Teacher', hourly_rate: '', absence_penalty: '', volume_horaire: '192' });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try { const token = localStorage.getItem('token'); const res = await fetch('http://localhost:5000/api/departments', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setDepartments(await res.json()); } catch (error) { console.error(error); }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    
    // If selecting an administrative role, reset department_id to null
    if (name === 'role' && ['DEAN', 'VICE_DEAN', 'RECTOR', 'VICE_RECTOR'].includes(value)) {
      newFormData.department_id = '';
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { toast.error(t('addEmployee.sessionExpired')); return; }
    const loadToast = toast.loading(t('addEmployee.creatingAccount'));
    try {
      const response = await fetch('http://localhost:5000/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) });
      const data = await response.json();
      toast.dismiss(loadToast);
      if (response.ok) { toast.success(`${formData.role} ${t('addEmployee.accountCreated')} ${formData.prenom}`); onSuccess(); }
      else { toast.error(data.message || t('addEmployee.errorCreating')); }
    } catch (error) { toast.dismiss(loadToast); toast.error(t('common.serverError')); }
  };

  const showDepartment = !['DEAN', 'VICE_DEAN', 'RECTOR', 'VICE_RECTOR'].includes(formData.role);

  return (
    <div className="add-employee-card">
      <div className="card-header"><h3>{t('addEmployee.title')}</h3><p>{t('addEmployee.subtitle')}</p></div>
      <form onSubmit={handleSubmit} className="add-form">
        <div className="mnadm-form-row">
          <div className="mnadm-form-group"><label className="mnadm-label">{t('addEmployee.lastName')}</label><input type="text" className="mnadm-input" name="nom" value={formData.nom} onChange={handleChange} required placeholder="Doe" /></div>
          <div className="mnadm-form-group"><label className="mnadm-label">{t('addEmployee.firstName')}</label><input type="text" className="mnadm-input" name="prenom" value={formData.prenom} onChange={handleChange} required placeholder="John" /></div>
        </div>
        <div className="mnadm-form-group">
          <label className="mnadm-label">{t('addEmployee.universityEmail')}</label>
          <div style={{ display: 'flex' }}>
            <input type="text" className="mnadm-input" value={formData.email.replace('@univ.dz', '')} onChange={(e) => { const cleanValue = e.target.value.replace(/@/g, ''); setFormData({ ...formData, email: cleanValue ? cleanValue + '@univ.dz' : '' }); }} required placeholder="john.doe" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none', flex: 1 }} />
            <span style={{ padding: '0 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderLeft: 'none', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', fontSize: '14px' }}>@univ.dz</span>
          </div>
        </div>
        <div className="mnadm-form-row">
          <div className="mnadm-form-group"><label className="mnadm-label">{t('addEmployee.initialPassword')}</label><input type="text" className="mnadm-input" name="password" value={formData.password} onChange={handleChange} required placeholder={t('addEmployee.tempPassword')} /></div>
          {showDepartment && (
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('addEmployee.department')}</label>
              <select className="mnadm-input" name="department_id" value={formData.department_id} onChange={handleChange} required>
                <option value="">{t('addEmployee.noDepartment')}</option>
                {departments.map(d => {
                  const translated = t('departments.' + d.name);
                  return (
                    <option key={d.id} value={d.id}>
                      {translated.includes('.') ? d.name : translated}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          <div className="mnadm-form-group">
            <label className="mnadm-label">{t('addEmployee.role')}</label>
            <select className="mnadm-input" name="role" value={formData.role} onChange={handleChange}>
              <option value="TEACHER">{t('roles.TEACHER')}</option>
              <option value="DEPARTMENT_HEAD">{t('addEmployee.headOfDept')}</option>
              <option value="VICE_DEAN">{t('roles.VICE_DEAN')}</option>
              <option value="DEAN">{t('roles.DEAN')}</option>
              <option value="VICE_RECTOR">{t('roles.VICE_RECTOR')}</option>
              <option value="RECTOR">{t('roles.RECTOR')}</option>
            </select>
          </div>
        </div>
        {formData.role === 'TEACHER' && (
          <div className="mnadm-form-row">
            <div className="mnadm-form-group">
              <label className="mnadm-label">{t('addEmployee.academicGrade')}</label>
              <select className="mnadm-input" name="grade" value={formData.grade} onChange={handleChange}>
                <option value="Teacher">{t('grades.Teacher')}</option>
                <option value="Vacataire">{t('grades.Vacataire')}</option>
                <option value="Assistant">{t('grades.Assistant')}</option>
                <option value="MAB">{t('grades.MAB')}</option>
                <option value="MAA">{t('grades.MAA')}</option>
                <option value="MCB">{t('grades.MCB')}</option>
                <option value="MCA">{t('grades.MCA')}</option>
                <option value="Professeur">{t('grades.Professeur')}</option>
              </select>
            </div>
            <div className="mnadm-form-group"><label className="mnadm-label">{t('addEmployee.extraHourlyRate')}</label><input type="number" className="mnadm-input" name="hourly_rate" value={formData.hourly_rate} onChange={handleChange} placeholder="e.g. 600" /></div>
            <div className="mnadm-form-group"><label className="mnadm-label">{t('addEmployee.absencePenalty')}</label><input type="number" className="mnadm-input" name="absence_penalty" value={formData.absence_penalty} onChange={handleChange} placeholder="e.g. 2000" /></div>
            <div className="mnadm-form-group"><label className="mnadm-label">{t('addEmployee.volumeHoraire')}</label><input type="number" className="mnadm-input" name="volume_horaire" value={formData.volume_horaire} onChange={handleChange} required placeholder="192" /></div>
          </div>
        )}
        <div className="form-actions" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button type="button" className="btn-cancel-pro" onClick={onCancel} style={{ flex: 1 }}>{t('common.cancel')}</button>
          <button type="submit" className="btn-confirm-pro" style={{ flex: 1 }}>{t('addEmployee.createAccount')}</button>
        </div>
      </form>
    </div>
  );
}

export default AddEmployee;
