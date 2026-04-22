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
    session_type: 'Cours',
    teacher_id: '',
    department_id: '',
    day_of_week: 'Lundi',
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
        // Filtrer pour ne garder que les enseignants
        setTeachers(allUsers.filter(u => u.role.toUpperCase() === 'ENSEIGNANT'));
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
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
      toast.error("Veuillez sélectionner un enseignant et un département");
      return;
    }

    const token = localStorage.getItem('token');
    const loadToast = toast.loading('Création de la séance...');

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
        toast.error(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error('Erreur serveur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir annuler ce cours ?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Séance supprimée');
        fetchData();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur serveur');
    }
  };

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <form onSubmit={handleAddSession} className="add-form" style={{ marginBottom: '30px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Module / Matière</label>
            <input type="text" name="module_name" value={formData.module_name} onChange={handleChange} required placeholder="ex: Mathématiques" />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="session_type" value={formData.session_type} onChange={handleChange}>
              <option value="Cours">Cours Magistral</option>
              <option value="TD">Travaux Dirigés (TD)</option>
              <option value="TP">Travaux Pratiques (TP)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Enseignant</label>
            <select name="teacher_id" value={formData.teacher_id} onChange={handleChange} required>
              <option value="">-- Choisir un enseignant --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Département pertinent</label>
            <select name="department_id" value={formData.department_id} onChange={handleChange} required>
              <option value="">-- Choisir le département --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Jour</label>
            <select name="day_of_week" value={formData.day_of_week} onChange={handleChange}>
              <option value="Lundi">Lundi</option>
              <option value="Mardi">Mardi</option>
              <option value="Mercredi">Mercredi</option>
              <option value="Jeudi">Jeudi</option>
              <option value="Vendredi">Vendredi</option>
              <option value="Samedi">Samedi</option>
              <option value="Dimanche">Dimanche</option>
            </select>
          </div>
          <div className="form-group">
            <label>Heure de début</label>
            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Heure de fin</label>
            <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required />
          </div>
        </div>
        
        <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: '10px' }}>
          <button type="submit" className="btn-submit">➕ Planifier la séance</button>
        </div>
      </form>

      {loading ? (
        <div className="loading-spinner">Chargement de l'emploi du temps...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Jour</th>
              <th>Horaire</th>
              <th>Module</th>
              <th>Type</th>
              <th>Enseignant</th>
              <th>Département</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td><strong>{s.day_of_week}</strong></td>
                <td>{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</td>
                <td>{s.module_name}</td>
                <td><span className="role-tag" style={{ background: '#e2e8f0', color: '#475569' }}>{s.session_type}</span></td>
                <td>{s.teacher_prenom} {s.teacher_nom}</td>
                <td>{s.department_name}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(s.id)}>Annuler</button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan="7" className="empty-state">Aucune séance planifiée pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageSessions;
