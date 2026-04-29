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

  const handleJustificationStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/absences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ justification_status: status })
      });
      if (res.ok) {
        toast.success(`Justification ${status === 'Accepted' ? 'acceptée' : 'refusée'}`);
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
              <th>Justification / Status</th>
              <th>{t('absences.penaltySalary')}</th>
            </tr>
          </thead>
          <tbody>
            {absences.map((a, index) => {
              const hasPenalty = a.justification_status !== 'Accepted';
              return (
                <tr key={a.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td><strong>{a.nom}</strong> {a.prenom}</td>
                  <td>{a.reason}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {a.justification_status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleJustificationStatus(a.id, 'Accepted')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Accepter</button>
                          <button onClick={() => handleJustificationStatus(a.id, 'Rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Refuser</button>
                        </div>
                      ) : (
                        <span className="role-tag" style={{ 
                          background: a.justification_status === 'Accepted' ? '#d1fae5' : a.justification_status === 'Rejected' ? '#fee2e2' : '#e2e8f0', 
                          color: a.justification_status === 'Accepted' ? '#065f46' : a.justification_status === 'Rejected' ? '#991b1b' : '#475569',
                          textAlign: 'center'
                        }}>
                          {a.justification_status === 'Accepted' ? 'Acceptée' : a.justification_status === 'Rejected' ? 'Refusée' : 'Aucune'}
                        </span>
                      )}
                      
                      {(a.justification_text || a.justification_file) && (
                        <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                          {a.justification_text && <div style={{ fontStyle: 'italic', marginBottom: '5px' }}>"{a.justification_text}"</div>}
                          {a.justification_file && (
                            <a href={`http://localhost:5000/uploads/justifications/${a.justification_file}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                              📎 Voir justificatif
                            </a>
                          )}
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
