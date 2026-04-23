import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './DashboardHR.css';

function ManageSessions() {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    module_name: '',
    session_type: 'Lecture',
    study_level: 'L1',
    teacher_id: '',
    department_id: '',
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '10:00'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resSessions, resUsers, resDepts] = await Promise.all([
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/departments', { headers })
      ]);

      if (resSessions.ok && resUsers.ok && resDepts.ok) {
        setSessions(await resSessions.json());
        setDepartments(await resDepts.json());
        
        const allUsers = await resUsers.json();
        // Keep only teachers
        setTeachers(allUsers.filter(u => u.role.toUpperCase() === 'TEACHER'));
      }
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.department_id) {
      toast.error("Please select a teacher and a department");
      return;
    }

    const token = localStorage.getItem('token');
    const loadToast = toast.loading('Scheduling session...');

    try {
      const res = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      toast.dismiss(loadToast);

      if (res.ok) {
        toast.success(data.message);
        // Reset form partially
        setFormData({ ...formData, module_name: '' });
        fetchData();
      } else {
        toast.error(data.message || 'Error during creation');
      }
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error('Server error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel this session?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Session cancelled');
        fetchData();
      } else {
        toast.error('Error during cancellation');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <form onSubmit={handleAddSession} className="add-form" style={{ marginBottom: '30px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Module / Subject</label>
            <input type="text" name="module_name" value={formData.module_name} onChange={handleChange} required placeholder="e.g. Mathematics" />
          </div>
          <div className="form-group">
            <label>Study Level</label>
            <select name="study_level" value={formData.study_level} onChange={handleChange}>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="M1">M1</option>
              <option value="M2">M2</option>
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="session_type" value={formData.session_type} onChange={handleChange}>
              <option value="Lecture">Lecture</option>
              <option value="Tutorial">Tutorial (TD)</option>
              <option value="Practical">Practical (TP)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Teacher</label>
            <select name="teacher_id" value={formData.teacher_id} onChange={handleChange} required>
              <option value="">-- Choose a teacher --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Relevant Department</label>
            <select name="department_id" value={formData.department_id} onChange={handleChange} required>
              <option value="">-- Choose the department --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Day</label>
            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange}>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required />
          </div>
        </div>
        
        <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: '10px' }}>
          <button type="submit" className="btn-submit">➕ Schedule Session</button>
        </div>
      </form>

      {loading ? (
        <div className="loading-spinner">Loading schedule...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Module / Subject</th>
              <th>Level</th>
              <th>Type</th>
              <th>Teacher</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td><strong>{s.day_of_week}</strong></td>
                <td>{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</td>
                <td>{s.module_name}</td>
                <td><span className="role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{s.study_level}</span></td>
                <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{s.session_type}</span></td>
                <td>{s.teacher_prenom} {s.teacher_nom}</td>
                <td>{s.department_name}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(s.id)}>Cancel</button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan="8" className="empty-state">No sessions scheduled at the moment.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageSessions;
