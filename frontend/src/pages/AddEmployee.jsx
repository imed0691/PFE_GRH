import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardHR.css';

function AddEmployee({ onCancel, onSuccess }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ 
    nom: '', prenom: '', email: '', password: '', role: 'TEACHER', 
    department_id: '', grade: 'Teacher', hourly_rate: '', absence_penalty: '', 
    volume_horaire: '192', base_salary: '',
    created_at: new Date().toISOString().split('T')[0] 
  });
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
    
    // Basic validation for numbers
    if (parseFloat(formData.base_salary) < 0) { toast.error("Le salaire de base doit être positif"); return; }

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
    <div className="animate-mnadm">
      <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)', padding: '40px', maxWidth: '950px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ background: 'var(--p-indigo-light)', color: 'var(--p-indigo)', width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          </div>
          <div>
            <h3 className="serif" style={{ fontSize: '26px', margin: 0, color: '#0f172a' }}>{t('addEmployee.title')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0', fontWeight: '500' }}>{t('addEmployee.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Informations Personnelles */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--p-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '20px', height: '2px', background: 'var(--p-indigo)', borderRadius: '2px' }}></span>
              {t('addEmployee.personalInfo') || 'Informations Personnelles'}
            </h4>
            <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('addEmployee.lastName')}</label>
                <input type="text" className="mnadm-input" name="nom" value={formData.nom} onChange={handleChange} required placeholder="Doe" style={{ borderRadius: '12px', fontWeight: '700' }} />
              </div>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('addEmployee.firstName')}</label>
                <input type="text" className="mnadm-input" name="prenom" value={formData.prenom} onChange={handleChange} required placeholder="John" style={{ borderRadius: '12px', fontWeight: '700' }} />
              </div>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">Date de Recrutement</label>
                <input type="date" className="mnadm-input" name="created_at" value={formData.created_at} onChange={handleChange} required style={{ borderRadius: '12px', fontWeight: '700' }} />
              </div>
            </div>
          </div>

          {/* Section 2: Identifiants & Rôle */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--p-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '20px', height: '2px', background: 'var(--p-indigo)', borderRadius: '2px' }}></span>
              {t('addEmployee.accountInfo') || 'Identifiants & Rôle'}
            </h4>
            <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('addEmployee.universityEmail')}</label>
                <div style={{ display: 'flex' }}>
                  <input 
                    type="text" 
                    className="mnadm-input" 
                    value={formData.email.replace('@univ.dz', '')} 
                    onChange={(e) => { 
                      const cleanValue = e.target.value.replace(/@/g, ''); 
                      setFormData({ ...formData, email: cleanValue ? cleanValue + '@univ.dz' : '' }); 
                    }} 
                    required 
                    placeholder="john.doe" 
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none', flex: 1, fontWeight: '700' }} 
                  />
                  <span style={{ 
                    padding: '0 16px', 
                    backgroundColor: '#f8fafc', 
                    color: '#64748b', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: 'none', 
                    borderTopRightRadius: '14px', 
                    borderBottomRightRadius: '14px', 
                    fontWeight: '800', 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '12px' 
                  }}>@univ.dz</span>
                </div>
              </div>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('addEmployee.initialPassword')}</label>
                <input type="text" className="mnadm-input" name="password" value={formData.password} onChange={handleChange} required placeholder={t('addEmployee.tempPassword')} style={{ borderRadius: '12px', fontWeight: '700' }} />
              </div>
            </div>

            <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: showDepartment ? '1fr 1fr' : '1fr', gap: '24px' }}>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('addEmployee.role')}</label>
                <select className="mnadm-input" name="role" value={formData.role} onChange={handleChange} style={{ borderRadius: '12px', fontWeight: '800' }}>
                  <option value="TEACHER">{t('roles.TEACHER')}</option>
                  <option value="DEPARTMENT_HEAD">{t('addEmployee.headOfDept')}</option>
                  <option value="VICE_DEAN">{t('roles.VICE_DEAN')}</option>
                  <option value="DEAN">{t('roles.DEAN')}</option>
                  <option value="VICE_RECTOR">{t('roles.VICE_RECTOR')}</option>
                  <option value="RECTOR">{t('roles.RECTOR')}</option>
                </select>
              </div>
              {showDepartment && (
                <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                  <label className="mnadm-label">{t('addEmployee.department')}</label>
                  <select className="mnadm-input" name="department_id" value={formData.department_id} onChange={handleChange} required style={{ borderRadius: '12px', fontWeight: '800' }}>
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
            </div>
          </div>

          {/* Section 3: Paramètres de Paie (Enseignants uniquement) */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--p-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '20px', height: '2px', background: 'var(--p-indigo)', borderRadius: '2px' }}></span>
              {t('addEmployee.payrollInfo') || 'Paramètres de Paie'}
            </h4>
            
            <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: formData.role === 'TEACHER' ? '1.5fr 1fr 1fr' : '1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                <label className="mnadm-label">{t('salary.baseSalary') || 'Salaire de Base (DA)'}</label>
                <input type="number" className="mnadm-input" name="base_salary" value={formData.base_salary} onChange={handleChange} required placeholder="e.g. 65000" style={{ borderRadius: '12px', fontWeight: '800' }} />
              </div>
              {formData.role === 'TEACHER' && (
                <>
                  <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                    <label className="mnadm-label">{t('addEmployee.academicGrade')}</label>
                    <select className="mnadm-input" name="grade" value={formData.grade} onChange={handleChange} style={{ borderRadius: '12px', fontWeight: '800' }}>
                      <option value="Teacher">{t('grades.Teacher')}</option>
                      <option value="MAB">{t('grades.MAB')}</option>
                      <option value="MAA">{t('grades.MAA')}</option>
                      <option value="MCB">{t('grades.MCB')}</option>
                      <option value="MCA">{t('grades.MCA')}</option>
                      <option value="Professeur">{t('grades.Professeur')}</option>
                    </select>
                  </div>
                  <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                    <label className="mnadm-label">{t('addEmployee.volumeHoraire') || 'Volume Horaire'}</label>
                    <input type="number" className="mnadm-input" name="volume_horaire" value={formData.volume_horaire} onChange={handleChange} required placeholder="192" style={{ borderRadius: '12px', fontWeight: '800' }} />
                  </div>
                </>
              )}
            </div>

            {formData.role === 'TEACHER' && (
              <div className="mnadm-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                  <label className="mnadm-label" style={{ color: '#16a34a' }}>{t('addEmployee.extraHourlyRate') || 'Taux Séance Supp. (DA)'}</label>
                  <input type="number" className="mnadm-input" name="hourly_rate" value={formData.hourly_rate} onChange={handleChange} required placeholder="e.g. 600" style={{ borderRadius: '12px', fontWeight: '800', border: '1px solid #dcfce7' }} />
                </div>
                <div className="mnadm-form-group" style={{ marginBottom: 0 }}>
                  <label className="mnadm-label" style={{ color: '#dc2626' }}>{t('addEmployee.absencePenalty') || 'Retenue Absence (DA)'}</label>
                  <input type="number" className="mnadm-input" name="absence_penalty" value={formData.absence_penalty} onChange={handleChange} required placeholder="e.g. 2000" style={{ borderRadius: '12px', fontWeight: '800', border: '1px solid #fee2e2' }} />
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
            <button type="button" className="btn-cancel-pro" onClick={onCancel} style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '15px', fontWeight: '800' }}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-confirm-pro" style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '15px', fontWeight: '900' }}>
              {t('addEmployee.createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployee;
