import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';

function ManageAbsences({ user: propUser }) {
  const [absences, setAbsences] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [userDeptId, setUserDeptId] = useState(null);
  const { t } = useLanguage();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceReason, setAbsenceReason] = useState('');

  useEffect(() => {
    if (propUser) {
      setUserRole(propUser.role);
      setUserId(propUser.id);
      setUserDeptId(propUser.department_id);
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          setUserRole(decoded.role);
          setUserId(decoded.id);
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser) setUserDeptId(storedUser.department_id);
        } catch (e) {}
      }
    }
  }, [propUser]);

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAbsences(await res.json());
    } catch (error) {
      toast.error(t('absences.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/teachers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTeachers(await res.json());
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  useEffect(() => {
    fetchAbsences();
    if (userRole) {
      fetchTeachers();
    }
  }, [userRole]);

  const handleMarkAbsence = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !absenceDate || !absenceReason) {
      return toast.error(t('teacher.allFieldsRequired'));
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          teacher_id: selectedTeacher,
          date: absenceDate,
          reason: absenceReason
        })
      });

      if (res.ok) {
        toast.success(t('absences.statusUpdated'));
        setShowForm(false);
        setAbsenceReason('');
        setSelectedTeacher('');
        fetchAbsences();
      } else {
        toast.error(t('absences.errorUpdating'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    }
  };

  const toggleField = async (id, field, currentValue) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: !currentValue })
      });
      if (res.ok) {
        fetchAbsences();
      } else {
        toast.error(t('absences.errorUpdating'));
      }
    } catch (error) {
      toast.error(t('common.serverError'));
    }
  };

  const isDeptHead = userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT';
  const isHR = ['HR', 'RH', 'HR_MANAGER', 'RH_MANAGER'].includes(userRole);

  const teacherOptions = teachers.map(teacher => ({ value: teacher.id, label: `${teacher.prenom} ${teacher.nom}` }));

  if (loading) return <div className="loading-spinner">{t('common.loading')}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {isDeptHead && (
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <h3 style={{ margin: 0 }}>{t('absences.markAbsence')}</h3>
            <button 
              onClick={() => setShowForm(!showForm)}
              style={{ background: showForm ? '#ef4444' : 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              {showForm ? t('common.cancel') : t('common.add')}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleMarkAbsence} style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
              <div className="form-group">
                <label>{t('common.teacher')}</label>
                <Select 
                  options={teacherOptions} 
                  value={teacherOptions.find(o => o.value === selectedTeacher)} 
                  onChange={o => setSelectedTeacher(o?.value || '')} 
                  placeholder={t('evaluations.selectTeacher')} 
                  isClearable 
                  isSearchable 
                />
              </div>
              <div className="form-group">
                <label>{t('common.date')}</label>
                <input type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t('teacher.reason')}</label>
                <input type="text" value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} required placeholder="Ex: Absence séance TD" />
              </div>
              <button type="submit" style={{ gridColumn: 'span 3', padding: '10px' }}>{t('common.save')}</button>
            </form>
          )}
        </div>
      )}

      <div className="table-card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>{t('absences.title')}</h3>
        <table className="modern-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('common.date')}</th>
              <th>{t('common.teacher')}</th>
              <th>{t('teacher.reason')}</th>
              <th>{t('absences.justified')}</th>
              <th>{t('absences.caughtUp')}</th>
              <th>{t('absences.penaltySalary')}</th>
            </tr>
          </thead>
          <tbody>
            {absences.map((a, index) => {
              const hasPenalty = !a.has_justification && !a.is_caught_up;
              return (
                <tr key={a.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td><strong>{a.nom}</strong> {a.prenom}</td>
                  <td>{a.reason}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button 
                        onClick={() => (isDeptHead || isHR) && toggleField(a.id, 'has_justification', a.has_justification)}
                        className={`role-tag ${a.has_justification ? 'active' : ''}`}
                        style={{ 
                          background: a.has_justification ? '#d1fae5' : '#fee2e2', 
                          color: a.has_justification ? '#065f46' : '#991b1b',
                          border: 'none',
                          cursor: (isDeptHead || isHR) ? 'pointer' : 'default',
                          padding: '4px 10px'
                        }}
                      >
                        {a.has_justification ? t('common.yes') : t('common.no')}
                      </button>
                      {a.justification_text && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '150px', fontStyle: 'italic' }}>
                          "{a.justification_text}"
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button 
                        onClick={() => (isDeptHead || isHR) && toggleField(a.id, 'is_caught_up', a.is_caught_up)}
                        className={`role-tag ${a.is_caught_up ? 'active' : ''}`}
                        style={{ 
                          background: a.is_caught_up ? '#dbeafe' : '#fef3c7', 
                          color: a.is_caught_up ? '#1e40af' : '#92400e',
                          border: 'none',
                          cursor: (isDeptHead || isHR) ? 'pointer' : 'default',
                          padding: '4px 10px'
                        }}
                      >
                        {a.is_caught_up ? t('common.yes') : t('common.no')}
                      </button>
                      {a.catchup_date && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(a.catchup_date).toLocaleDateString()} {a.catchup_start_time?.substring(0, 5)}-{a.catchup_end_time?.substring(0, 5)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      color: hasPenalty ? '#ef4444' : '#10b981', 
                      fontWeight: 'bold',
                      fontSize: '0.9em'
                    }}>
                      {hasPenalty ? t('common.yes') : t('common.no')}
                    </span>
                  </td>
                </tr>
              );
            })}
            {absences.length === 0 && <tr><td colSpan="7" className="empty-state">{t('absences.noRequests')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageAbsences;
