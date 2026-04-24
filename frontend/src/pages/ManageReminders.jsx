import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ManageReminders() {
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    teacher_id: '',
    message: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const users = await res.json();
          setTeachers(users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT'));
        }
      } catch (error) {
        toast.error('Error loading teachers');
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
          ...formData,
          teacher_id: formData.teacher_id || null
        })
      });

      if (res.ok) {
        toast.success("Reminder sent successfully");
        setFormData({ ...formData, message: '' });
      } else {
        toast.error("Error sending reminder");
      }
    } catch (error) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-card" style={{ padding: '20px', maxWidth: '600px' }}>
      <h3 style={{ marginBottom: '20px' }}>Send Reminder to Teachers</h3>
      
      <form onSubmit={handleSubmit} className="add-form">
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Recipient</label>
          <select name="teacher_id" value={formData.teacher_id} onChange={handleChange}>
            <option value="">All Teachers</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Reminder Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="info">Information (Blue)</option>
            <option value="warning">Important / Warning (Orange)</option>
            <option value="error">Urgent (Red)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>Message</label>
          <textarea 
            name="message" 
            value={formData.message} 
            onChange={handleChange} 
            required 
            rows="4" 
            placeholder="E.g. Don't forget to submit grades before the 15th..."
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          ></textarea>
        </div>

        <button type="submit" disabled={loading} style={{
          background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
        }}>
          {loading ? 'Sending...' : 'Send Reminder 📢'}
        </button>
      </form>
    </div>
  );
}

export default ManageReminders;
