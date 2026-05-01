const db = require('../config/db');

// Helper to count occurrences of a day of week in a specific month/year
const countDayOccurrences = (dayName, month, year) => {
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
  let count = 0;
  let date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === dayIndex) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
};

// RH: Calculer les salaires (Dynamique)
exports.calculateSalaries = (req, res) => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  // Get all teachers
  const teachersQuery = `
    SELECT u.id, u.nom, u.prenom, u.role, u.grade, u.base_salary, u.hourly_rate, u.absence_penalty
    FROM users u 
    WHERE u.role IN ('TEACHER', 'ENSEIGNANT')
  `;
  
  db.query(teachersQuery, (err, teachers) => {
    if (err) return res.status(500).json({ error: err.message });

    // For each teacher, calculate dynamic stats
    const salaryPromises = teachers.map(t => {
      return new Promise((resolve, reject) => {
        // 1. Get Extra Sessions scheduled
        const sessionsQuery = "SELECT * FROM academic_sessions WHERE teacher_id = ? AND is_extra = TRUE";
        db.query(sessionsQuery, [t.id], (err, sessions) => {
          if (err) return reject(err);

          let totalExtraSessionsThisMonth = 0;
          sessions.forEach(s => {
            if (s.session_date) {
              const sDate = new Date(s.session_date);
              if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
                totalExtraSessionsThisMonth++;
              }
            } else {
              totalExtraSessionsThisMonth += countDayOccurrences(s.day_of_week, currentMonth, currentYear);
            }
          });

          // 2. Get Absences this month
          const absQuery = `
            SELECT COUNT(*) as count 
            FROM absences 
            WHERE teacher_id = ? 
              AND MONTH(date) = ? AND YEAR(date) = ?
              AND (justification_status IS NULL OR justification_status != 'Accepted')
              AND is_caught_up = FALSE
          `;
          db.query(absQuery, [t.id, currentMonth + 1, currentYear], (err, absRes) => {
            if (err) return reject(err);
            
            const unjustifiedAbsences = absRes[0].count;
            const extraPay = totalExtraSessionsThisMonth * (t.hourly_rate || 0);
            const penaltyAmount = unjustifiedAbsences * (t.absence_penalty || 0);
            const netSalary = (t.base_salary || 0) + extraPay - penaltyAmount;

            resolve({
              id: t.id,
              nom: t.nom,
              prenom: t.prenom,
              grade: t.grade || 'Teacher',
              base_salary: t.base_salary || 0,
              extra_hours: totalExtraSessionsThisMonth, // Here extra_hours is actually count of extra sessions
              hourly_rate: t.hourly_rate || 0,
              absences: unjustifiedAbsences,
              absence_penalty: t.absence_penalty || 0,
              total_penalty: penaltyAmount,
              extra_pay: extraPay,
              net_salary: netSalary > 0 ? netSalary : 0
            });
          });
        });
      });
    });

    Promise.all(salaryPromises)
      .then(results => res.json(results))
      .catch(err => res.status(500).json({ error: err.message }));
  });
};

// Teacher: Get my own salary and history (Dynamique)
exports.getMySalary = (req, res) => {
  const teacherId = req.user.id;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const userQuery = "SELECT id, nom, prenom, grade, base_salary, hourly_rate, absence_penalty FROM users WHERE id = ?";
  db.query(userQuery, [teacherId], (err, users) => {
    if (err || users.length === 0) return res.status(500).json({ error: "User not found" });
    
    const t = users[0];

    // Calculate dynamic stats for current teacher
    const sessionsQuery = "SELECT * FROM academic_sessions WHERE teacher_id = ? AND is_extra = TRUE";
    db.query(sessionsQuery, [t.id], (err, sessions) => {
      if (err) return res.status(500).json({ error: err.message });

      let totalExtraSessionsThisMonth = 0;
      sessions.forEach(s => {
        if (s.session_date) {
          const sDate = new Date(s.session_date);
          if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
            totalExtraSessionsThisMonth++;
          }
        } else {
          totalExtraSessionsThisMonth += countDayOccurrences(s.day_of_week, currentMonth, currentYear);
        }
      });

      const absQuery = `
        SELECT COUNT(*) as count 
        FROM absences 
        WHERE teacher_id = ? 
          AND MONTH(date) = ? AND YEAR(date) = ?
          AND (justification_status IS NULL OR justification_status != 'Accepted')
          AND is_caught_up = FALSE
      `;
      db.query(absQuery, [t.id, currentMonth + 1, currentYear], (err, absRes) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const unjustifiedAbsences = absRes[0].count;
        const extraPay = totalExtraSessionsThisMonth * (t.hourly_rate || 0);
        const penaltyAmount = unjustifiedAbsences * (t.absence_penalty || 0);
        const netSalary = (t.base_salary || 0) + extraPay - penaltyAmount;

        const currentData = {
          base_salary: t.base_salary || 0,
          extra_hours: totalExtraSessionsThisMonth,
          hourly_rate: t.hourly_rate || 0,
          absences: unjustifiedAbsences,
          total_penalty: penaltyAmount,
          extra_pay: extraPay,
          net_salary: netSalary > 0 ? netSalary : 0,
          grade: t.grade
        };

        const historyQuery = "SELECT * FROM payrolls WHERE teacher_id = ? ORDER BY year DESC, month DESC";
        db.query(historyQuery, [teacherId], (err, history) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ current: currentData, history });
        });
      });
    });
  });
};

// RH: Update Salary Components
exports.updateSalary = (req, res) => {
  const teacherId = req.params.id;
  const { base_salary, hourly_rate, absence_penalty } = req.body;

  const query = "UPDATE users SET base_salary = ?, hourly_rate = ?, absence_penalty = ? WHERE id = ?";
  db.query(query, [base_salary, hourly_rate, absence_penalty, teacherId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Salary information updated successfully" });
  });
};

// RH: Finalize month and archive
exports.finalizeMonth = (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ message: "Month and Year are required" });

  // Use the same logic as calculateSalaries but archive the results
  // For simplicity, we assume this month index corresponds to the request
  const monthMap = { 'Janvier':0, 'Février':1, 'Mars':2, 'Avril':3, 'Mai':4, 'Juin':5, 'Juillet':6, 'Août':7, 'Septembre':8, 'Octobre':9, 'Novembre':10, 'Décembre':11 };
  const mIndex = monthMap[month] || new Date().getMonth();

  const teachersQuery = "SELECT id, base_salary, hourly_rate, absence_penalty FROM users WHERE role IN ('TEACHER', 'ENSEIGNANT')";
  db.query(teachersQuery, (err, teachers) => {
    if (err) return res.status(500).json({ error: err.message });

    const finalizePromises = teachers.map(t => {
      return new Promise((resolve, reject) => {
        const sessionsQuery = "SELECT * FROM academic_sessions WHERE teacher_id = ? AND is_extra = TRUE";
        db.query(sessionsQuery, [t.id], (err, sessions) => {
          if (err) return reject(err);
          let extraSessions = 0;
          sessions.forEach(s => {
            if (s.session_date) {
              const sDate = new Date(s.session_date);
              if (sDate.getMonth() === mIndex && sDate.getFullYear() === Number(year)) extraSessions++;
            } else {
              extraSessions += countDayOccurrences(s.day_of_week, mIndex, Number(year));
            }
          });

          const absQuery = "SELECT COUNT(*) as count FROM absences WHERE teacher_id = ? AND MONTH(date) = ? AND YEAR(date) = ? AND (justification_status IS NULL OR justification_status != 'Accepted') AND is_caught_up = FALSE";
          db.query(absQuery, [t.id, mIndex + 1, Number(year)], (err, absRes) => {
            if (err) return reject(err);
            const unjustifiedAbsences = absRes[0].count;
            const extraPay = extraSessions * (t.hourly_rate || 0);
            const penaltyAmount = unjustifiedAbsences * (t.absence_penalty || 0);
            const netSalary = (t.base_salary || 0) + extraPay - penaltyAmount;

            resolve([
              t.id, month, year, t.base_salary, extraSessions, t.hourly_rate, 
              t.absence_penalty, penaltyAmount, netSalary > 0 ? netSalary : 0, 'Paid'
            ]);
          });
        });
      });
    });

    Promise.all(finalizePromises).then(payrollData => {
      const insertQuery = "INSERT INTO payrolls (teacher_id, month, year, base_salary, extra_hours, hourly_rate, absence_penalty, total_penalty, net_salary, status) VALUES ?";
      db.query(insertQuery, [payrollData], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Month ${month} ${year} finalized and archived successfully.` });
      });
    }).catch(err => res.status(500).json({ error: err.message }));
  });
};

exports.recalculateSalary = (req, res) => {
  res.json({ message: "Salary recalculated dynamically" });
};
