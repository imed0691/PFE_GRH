import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import ManageDepartments from './ManageDepartments';
import ManageApprovals from './ManageApprovals';
import ManageReminders from './ManageReminders';
import Settings from './Settings';
import ManagePromotions from './ManagePromotions';
import './DashboardDean.css';

function DashboardDean({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const { t } = useLanguage();
  
  const [view, setView] = useState(localStorage.getItem('dean_view') || 'overview');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (error) {
      toast.error(t('dean.errorFetchStaff'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments", error);
    }
  };

  const fetchAbsences = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/absences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAbsences(data);
      }
    } catch (error) {
      console.error("Error fetching absences", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchAbsences();
  }, []);

  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('dean_view', newView);
  };

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview') || 'Aperçu' },
    { id: 'analytics', label: t('sidebar.analytics') || 'Analytique' },
    { id: 'approvals', label: t('sidebar.approvals_and_promotions') || 'Approvals & Promotions' },
    { id: 'departments', label: t('sidebar.departments') || 'Départements' },
    { id: 'staff', label: t('sidebar.staff') || 'Personnel' },
    { id: 'reminders', label: t('sidebar.reminders') || 'Communications' },
    { id: 'settings', label: t('settings.title') },
  ];

  const getPageTitle = () => {
    switch(view) {
      case 'overview': return t('sidebar.overview') || 'Tableau de Bord Doyen';
      case 'analytics': return t('sidebar.analytics') || 'Centre d\'Analyse';
      case 'approvals': return t('sidebar.approvals_and_promotions') || 'Approvals & Promotions';
      case 'departments': return t('sidebar.departments') || 'Gestion des Départements';
      case 'staff': return t('sidebar.staff') || 'Personnel de la Faculté';
      case 'reminders': return t('sidebar.reminders') || 'Notifications & Rappels';
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
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('sidebar.departments')}</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--p-indigo)', margin: 0 }}>{departments.length || 0}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #10b981' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('sidebar.staff')}</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: 0 }}>{users.length || 0}</p>
              </div>
              <div className="card-academic" style={{ borderTop: '4px solid #f59e0b' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('sidebar.teachers')}</h3>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', margin: 0 }}>{users.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length || 0}</p>
              </div>
            </div>

            <div className="analytics-overview-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="card-academic analytics-card">
                <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>{t('topbar.evaluationStatistics')}</h3>
                <div className="grade-distribution-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['Professeur', 'MCA', 'MCB', 'MAA', 'MAB', 'Teacher'].map(grade => {
                    const count = users.filter(u => u.grade?.toUpperCase() === grade.toUpperCase()).length;
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
                <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>{t('topbar.universityPedagogy')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {departments.slice(0, 5).map(dept => (
                    <div key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--p-indigo)', fontWeight: 'bold' }}>
                        {dept.name?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{dept.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t('common.status')}: {t('common.completed')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : view === 'analytics' ? (
          <div className="analytics-hub-pro animate-mnadm">
            <div className="analytics-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 className="academic-title">{t('topbar.departmentSchedules')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('dean.welcomeText').substring(0, 80)}...</p>
              </div>
              <div className="last-sync-badge">
                <span className="pulse-dot"></span>
                {t('common.active')}
              </div>
            </div>

            <div className="benchmarking-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
              {/* Departmental Strength Comparison */}
              <div className="card-academic">
                <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>{t('dean.facultyStrength')}</h3>
                <div className="benchmarking-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {departments.map(dept => {
                    const deptStaff = users.filter(u => u.department_id === dept.id).length;
                    const maxStaff = Math.max(...departments.map(d => users.filter(u => u.department_id === d.id).length), 1);
                    const percentage = (deptStaff / maxStaff) * 100;
                    
                    return (
                      <div key={dept.id} className="benchmark-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>{dept.name}</span>
                          <span style={{ fontWeight: '800', color: 'var(--p-indigo)' }}>{deptStaff} {t('hr.personnel')}</span>
                        </div>
                        <div className="benchmark-bar-bg" style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                          <div className="benchmark-bar-fill" style={{ 
                            height: '100%', 
                            width: `${percentage}%`, 
                            background: 'linear-gradient(90deg, var(--p-indigo), #818cf8)',
                            borderRadius: '5px',
                            transition: 'width 1s ease'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Absence Rate Comparison */}
              <div className="card-academic">
                <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>Absence Incidence Rate</h3>
                <div className="benchmarking-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {departments.map(dept => {
                    const deptAbsences = absences.filter(a => {
                      const userObj = users.find(u => u.id === a.teacher_id);
                      return userObj && userObj.department_id === dept.id;
                    }).length;
                    
                    const maxAbs = Math.max(...departments.map(d => {
                      return absences.filter(a => {
                        const userObj = users.find(u => u.id === a.teacher_id);
                        return userObj && userObj.department_id === d.id;
                      }).length;
                    }), 1);
                    
                    const percentage = (deptAbsences / maxAbs) * 100;
                    
                    return (
                      <div key={dept.id} className="benchmark-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>{dept.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '800', color: '#ef4444' }}>{deptAbsences} Records</span>
                            {deptAbsences > 5 && <span className="warning-pill-mini">Alert</span>}
                          </div>
                        </div>
                        <div className="benchmark-bar-bg" style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                          <div className="benchmark-bar-fill" style={{ 
                            height: '100%', 
                            width: `${percentage}%`, 
                            background: 'linear-gradient(90deg, #ef4444, #f87171)',
                            borderRadius: '5px',
                            transition: 'width 1.2s ease'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detailed Metrics Table */}
            <div className="card-academic" style={{ marginTop: '24px' }}>
              <h3 className="academic-title" style={{ fontSize: '16px', marginBottom: '24px' }}>Faculty Performance Scorecard</h3>
              <div className="table-academic-wrapper">
                <table className="table-academic">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Total Staff</th>
                      <th>Teacher Ratio</th>
                      <th>Absence Load</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map(dept => {
                      const deptStaff = users.filter(u => u.department_id === dept.id);
                      const teachers = deptStaff.filter(u => u.role === 'TEACHER' || u.role === 'ENSEIGNANT').length;
                      const deptAbs = absences.filter(a => {
                        const u = users.find(us => us.id === a.teacher_id);
                        return u && u.department_id === dept.id;
                      }).length;

                      return (
                        <tr key={dept.id}>
                          <td><strong>{dept.name}</strong></td>
                          <td>{deptStaff.length}</td>
                          <td>{Math.round((teachers / (deptStaff.length || 1)) * 100)}%</td>
                          <td>{deptAbs}</td>
                          <td>
                            <span className={`role-badge ${deptAbs < 3 ? 'role-rector' : deptAbs < 7 ? 'role-dept-head' : 'role-teacher'}`} style={{ fontSize: '10px' }}>
                              {deptAbs < 3 ? 'OPTIMAL' : deptAbs < 7 ? 'STABLE' : 'CRITICAL'}
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
        ) : view === 'promotions' ? (
          <ManagePromotions user={user} />
        ) : view === 'departments' ? (
          <ManageDepartments />
        ) : view === 'reminders' ? (
          <ManageReminders />
        ) : view === 'settings' ? (
          <Settings user={user} onProfileUpdate={() => window.location.reload()} />
        ) : (
          <div className="card-academic">
            <h2 className="academic-title" style={{ marginBottom: '24px' }}>{t('sidebar.staff') || 'Faculty Staff'}</h2>
            <div className="table-academic-wrapper">
              {loading ? (
                <div className="loading-spinner-academic"></div>
              ) : (
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
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DashboardDean;
