import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageDepartments from './ManageDepartments';
import ManageApprovals from './ManageApprovals';
import ManageReminders from './ManageReminders';
import Settings from './Settings';
import './DashboardRector.css';

function DashboardRector({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { t } = useLanguage();

  // Overview stats
  const [teachersCount, setTeachersCount] = useState(0);
  const [deansCount, setDeansCount] = useState(0);
  const [absences, setAbsences] = useState([]);

  const [view, setView] = useState(localStorage.getItem('rector_view') || 'overview');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resUsers, resSessions, resDepts] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers }),
        fetch('http://localhost:5000/api/sessions', { headers }),
        fetch('http://localhost:5000/api/departments', { headers })
      ]);

      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setUsers(usersData);
        setTeachersCount(usersData.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length);
        setDeansCount(usersData.filter(u => ['DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN'].includes(u.role)).length);
      }
      if (resSessions.ok) {
        const sessions = await resSessions.json();
        setSessionsCount(sessions.length);
      }
      if (resDepts.ok) {
        const deptsData = await resDepts.json();
        setDepartments(deptsData);
      }
      
      const resAbs = await fetch('http://localhost:5000/api/absences', { headers });
      if (resAbs.ok) {
        setAbsences(await resAbs.json());
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('rector_view', newView);
  };

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview') || 'Vue d\'ensemble' },
    { id: 'analytics', label: t('sidebar.analytics') || 'Analytique Universitaire' },
    { id: 'approvals', label: t('sidebar.approvals') || 'Approbations' },
    { id: 'directory', label: t('sidebar.staff') || 'Personnel' },
    { id: 'departments', label: t('sidebar.faculties') || 'Structure' },
    { id: 'reminders', label: t('sidebar.reminders') || 'Communications' },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'overview': return t('sidebar.overview') || 'Tableau de Bord Recteur';
      case 'analytics': return t('sidebar.analytics') || 'Centre d\'Intelligence Universitaire';
      case 'approvals': return t('sidebar.approvals') || 'Approbations Stratégiques';
      case 'directory': return t('sidebar.staff') || 'Annuaire Global du Personnel';
      case 'departments': return t('sidebar.faculties') || 'Structure Universitaire';
      case 'reminders': return t('sidebar.reminders') || 'Communications Rectorat';
      case 'settings': return t('settings.title');
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      setView={handleViewChange}
      menuItems={menuItems}
      onLogout={onLogout}
      title={getPageTitle()}
    >
      <div className="animate-mnadm">
        {view === 'overview' ? (
          <div className="overview-container-premium">
            <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div className="card-academic" style={{ borderTop: '4px solid var(--p-indigo)' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('rector.totalStaff')}</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--p-indigo)', margin: 0 }}>{users.length}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #10b981' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('rector.deansViceDeans')}</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: 0 }}>{deansCount}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #f59e0b' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('rector.teachers')}</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', margin: 0 }}>{users.filter(u => u.grade === 'Professor' || u.grade === 'MCA').length}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #8b5cf6' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('rector.departments')}</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#8b5cf6', margin: 0 }}>{departments.length}</p>
              </div>
            </div>

            <div className="analytics-overview-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="card-academic analytics-card">
                <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>University Grade Distribution</h3>
                <div className="grade-distribution-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['Professor', 'MCA', 'MCB', 'MAA', 'MAB'].map(grade => {
                    const count = users.filter(u => u.grade === grade).length;
                    const percentage = users.length > 0 ? (count / users.length) * 100 : 0;
                    return (
                      <div key={grade} className="grade-bar-wrapper">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{t('grades.' + grade)}</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--p-indigo)' }}>{count} {t('hr.personnel')}</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, var(--p-indigo), var(--p-purple))', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-academic analytics-card">
                <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>Recent University Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-badge-pro bg-blue" style={{ width: '32px', height: '32px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      <strong>{users.length}</strong> {t('rector.totalStaff')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-badge-pro bg-purple" style={{ width: '32px', height: '32px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      <strong>{absences.length}</strong> {t('sidebar.absences')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : view === 'analytics' ? (
          <div className="analytics-hub-pro animate-mnadm">
             <h2 className="academic-title">Global University Benchmarking</h2>
             <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Comparative insights across all faculties and administrative sectors</p>
             
             <div className="card-academic">
                <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>Sector Performance Scorecard</h3>
                <div className="table-academic-wrapper">
                  <table className="table-academic">
                    <thead>
                      <tr>
                        <th>{t('common.department')}</th>
                        <th>{t('rector.totalStaff')}</th>
                        <th>{t('rector.teachers')}</th>
                        <th>{t('sidebar.absences')}</th>
                        <th>{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.slice(0, 8).map(dept => {
                        const deptStaff = users.filter(u => u.department_id === dept.id);
                        const seniors = deptStaff.filter(u => u.grade === 'Professor' || u.grade === 'MCA').length;
                        const deptAbs = absences.filter(a => {
                          const u = users.find(us => us.id === a.teacher_id);
                          return u && u.department_id === dept.id;
                        }).length;

                        return (
                          <tr key={dept.id}>
                            <td><strong>{dept.name}</strong></td>
                            <td>{deptStaff.length}</td>
                            <td>{seniors}</td>
                            <td>{deptAbs}</td>
                            <td>
                              <span className={`role-badge ${deptAbs < 5 ? 'role-rector' : 'role-dept-head'}`} style={{ fontSize: '10px' }}>
                                {deptAbs < 5 ? t('rector.statusOptimized') : t('rector.statusMonitored')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        ) : view === 'approvals' ? (
          <ManageApprovals user={user} />
        ) : view === 'directory' ? (
          <div className="card-academic">
            <h2 className="academic-title" style={{ marginBottom: '24px' }}>{t('sidebar.staff') || 'Staff Directory'}</h2>
            <div className="table-academic-wrapper">
              <table className="table-academic">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>{t('common.id') || '#ID'}</th>
                    <th>{t('common.fullName')}</th>
                    <th>{t('common.department')}</th>
                    <th>{t('common.role')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .sort((a, b) => {
                      const roleOrder = {
                        'RECTOR': 1, 'RECTEUR': 1,
                        'VICE_RECTOR': 2,
                        'DEAN': 3, 'DOYEN': 3,
                        'VICE_DEAN': 4,
                        'DEPARTMENT_HEAD': 5, 'CHEF_DEPARTEMENT': 5,
                        'TEACHER': 6, 'ENSEIGNANT': 6
                      };
                      return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
                    })
                    .map(u => (
                    <tr key={u.id}>
                      <td><span className="id-badge">#{u.id}</span></td>
                      <td>
                        <div className="user-profile-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-circle" style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '12px', 
                            background: 'linear-gradient(135deg, var(--p-indigo), #6366f1)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: '800', 
                            fontSize: '14px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}>
                            {(u.nom?.[0] || '')+(u.prenom?.[0] || '')}
                          </div>
                          <div className="user-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="user-name" style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                              {u.nom} {u.prenom}
                            </span>
                            <span className="user-email" style={{ 
                              color: '#64748b', 
                              fontSize: '12px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px' 
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="dept-tag">
                          {u.department_name && u.department_name !== 'null' ? (
                            (() => {
                              const translated = t('departments.' + u.department_name);
                              return translated.includes('.') ? u.department_name : translated;
                            })()
                          ) : '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`role-badge role-${(u.role || '').toLowerCase()}`}>
                          {t('roles.' + u.role) || u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : view === 'departments' ? (
          <ManageDepartments />
        ) : view === 'reminders' ? (
          <ManageReminders />
        ) : view === 'settings' ? (
          <Settings user={user} onProfileUpdate={() => window.location.reload()} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default DashboardRector;
