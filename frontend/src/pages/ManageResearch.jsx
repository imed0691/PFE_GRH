import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManageResearch({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Publication');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/research', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (error) {
      toast.error('Error loading research activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, type, date, description, link })
      });

      if (res.ok) {
        toast.success('Activity recorded!');
        setTitle('');
        setDate('');
        setDescription('');
        setLink('');
        fetchActivities();
      } else {
        toast.error("Error recording activity");
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const isTeacher = user.role === 'TEACHER' || user.role === 'ENSEIGNANT';

  return (
    <div className="table-card" style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Research Activities & Publications</h3>

      {isTeacher && (
        <form onSubmit={handleSubmit} style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #bae6fd' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#0369a1' }}>Record New Activity</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Title of publication, conference, or project" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="Publication">Publication (Journal/Book)</option>
                <option value="Conference">Conference / Seminar</option>
                <option value="Project">Research Project</option>
                <option value="Award">Award / Recognition</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
             <div>
               <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Description</label>
               <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Briefly describe your contribution..."></textarea>
             </div>
             <div>
               <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>Link (URL)</label>
               <input type="url" value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="https://..." />
             </div>
          </div>
          <button type="submit" className="btn-submit" style={{ background: '#0ea5e9' }}>Record Activity</button>
        </form>
      )}

      {loading ? (
        <div className="loading-spinner">Loading activities...</div>
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Title</th>
              {!isTeacher && <th>Teacher</th>}
              <th>Details</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>
                  <span className="role-tag" style={{ 
                    background: a.type === 'Publication' ? '#dbeafe' : a.type === 'Conference' ? '#fef3c7' : '#d1fae5',
                    color: a.type === 'Publication' ? '#1e40af' : a.type === 'Conference' ? '#92400e' : '#065f46'
                  }}>
                    {a.type}
                  </span>
                </td>
                <td style={{ fontWeight: '600', color: '#1e293b' }}>{a.title}</td>
                {!isTeacher && <td>{a.teacher_nom} {a.teacher_prenom}</td>}
                <td style={{ maxWidth: '250px', wordBreak: 'break-word', fontSize: '13px', color: '#64748b' }}>
                  {a.description}
                </td>
                <td>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>
                      🔗 View
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr><td colSpan={isTeacher ? 5 : 6} className="empty-state">No activities recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageResearch;
