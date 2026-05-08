const db = require('../config/db');

// Helper to count occurrences of a day of week in a specific month/year up to a certain day/time, starting from a startDate
const countPastDayOccurrences = (dayName, month, year, endTime = '23:59:00', now = new Date(), startDate = new Date(year, month, 1)) => {
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
  let count = 0;
  
  // Normalize date to start of month
  let date = new Date(year, month, 1);
  
  // Normalize startDate to start of day for comparison
  const sDate = new Date(startDate);
  sDate.setHours(0,0,0,0);

  const [eh, em] = (endTime && typeof endTime === 'string') 
    ? endTime.split(':').map(Number)
    : [23, 59];
  const sessionEndHour = eh + em/60;
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Past month
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
    while (date.getMonth() === month) {
      if (date.getDay() === dayIndex && date >= sDate) count++;
      date.setDate(date.getDate() + 1);
    }
  } else if (year === now.getFullYear() && month === now.getMonth()) {
    // Current month
    while (date.getMonth() === month && date <= now) {
      if (date.getDay() === dayIndex && date >= sDate) {
        if (date.toDateString() === now.toDateString()) {
          // If it's today, only count if it's finished
          if (sessionEndHour <= currentHour) count++;
        } else {
          count++;
        }
      }
      date.setDate(date.getDate() + 1);
    }
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
              const sessionCreatedAt = new Date(s.created_at);
              const sessionEnd = new Date(s.session_date);
              if (s.end_time && typeof s.end_time === 'string') {
                const [h, m] = s.end_time.split(':');
                sessionEnd.setHours(parseInt(h), parseInt(m), 0, 0);
              } else {
                sessionEnd.setHours(23, 59, 59, 999);
              }
              if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear && sessionEnd <= now) {
                totalExtraSessionsThisMonth++;
              }
              if (now.getDate() < 15) {
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                if (sDate.getMonth() === prevMonth && sDate.getFullYear() === prevYear) {
                  totalExtraSessionsThisMonth++;
                }
              }
            }
          });

          // 2. Get Absences this month
          const absQuery = `
            SELECT is_extra, date, start_time, justification_status, is_caught_up
            FROM absences 
            WHERE teacher_id = ? AND is_cleared = FALSE
              AND date <= DATE(?) 
          `;
          db.query(absQuery, [t.id, now], (err, absences) => {
            if (err) return reject(err);
            
            let regUnjustified = 0;
            let extraUnjustified = 0;

            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            absences.forEach(a => {
              const aDateTime = new Date(a.date);
              if (a.start_time) {
                const [ah, am] = a.start_time.split(':').map(Number);
                aDateTime.setHours(ah, am, 0, 0);
              }
              const isCurrentMonth = aDateTime.getMonth() === currentMonth && aDateTime.getFullYear() === currentYear;
              const isPassed = aDateTime <= now;
              const isPrevMonthGrace = now.getDate() < 15 && aDateTime.getMonth() === prevMonth && aDateTime.getFullYear() === prevYear;

              if ((isCurrentMonth && isPassed) || isPrevMonthGrace) {
                if (a.justification_status !== 'Accepted' && !a.is_caught_up) {
                  if (a.is_extra) extraUnjustified++;
                  else regUnjustified++;
                }
              }
            });

            // Extra pay = (Scheduled - Unjustified Absences) * rate
            let finalExtraSessions = totalExtraSessionsThisMonth - extraUnjustified;
            if (finalExtraSessions < 0) finalExtraSessions = 0;

            const extraPay = finalExtraSessions * (t.hourly_rate || 0);
            const penaltyAmount = regUnjustified * (t.absence_penalty || 0);
            const netSalary = (t.base_salary || 0) + extraPay - penaltyAmount;

            resolve({
              id: t.id,
              nom: t.nom,
              prenom: t.prenom,
              grade: t.grade || 'Teacher',
              base_salary: t.base_salary || 0,
              extra_hours: finalExtraSessions,
              hourly_rate: t.hourly_rate || 0,
              absences: regUnjustified,
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

// Helper to calculate salary for a specific teacher and month/year
const calculateSalaryForMonth = (teacher, month, year, sessions, now) => {
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const monthName = monthNames[month];
  
  let totalExtraSessions = 0;
  let countedSessions = [];
  
  try {
    sessions.forEach(s => {
      if (s.session_date) {
        const sDate = new Date(s.session_date);
        const sessionEnd = new Date(s.session_date);
        
        if (s.end_time && typeof s.end_time === 'string') {
          const [h, m] = s.end_time.split(':');
          sessionEnd.setHours(parseInt(h), parseInt(m), 0, 0);
        } else {
          sessionEnd.setHours(23, 59, 59, 999);
        }
        
        if (sDate.getMonth() === month && sDate.getFullYear() === year && sessionEnd <= now) {
          totalExtraSessions++;
          countedSessions.push({
            id: s.id,
            module_name: s.module_name,
            date: s.session_date,
            day: s.day_of_week,
            time: s.start_time
          });
        }
      }
    });
  } catch (loopErr) {
    console.error("[Salary] Error in sessions loop:", loopErr);
    return Promise.reject(new Error("Loop Error: " + loopErr.message));
  }

  return new Promise((resolve, reject) => {
    const absQuery = `
      SELECT id, is_extra, date, start_time, justification_status, is_caught_up, reason
      FROM absences 
      WHERE teacher_id = ? AND is_cleared = FALSE
    `;
    db.query(absQuery, [teacher.id], (err, absences) => {
      if (err) {
        console.error("[Salary] DB Error (Absences Query):", err);
        return reject(err);
      }
      
      try {
        let regUnjustified = 0;
        let extraUnjustified = 0;
        let absenceDetails = [];

        absences.forEach(a => {
          if (!a.date) return;
          const aDate = new Date(a.date);
          const aDateTime = new Date(a.date);
          if (a.start_time) {
            const [ah, am] = a.start_time.split(':').map(Number);
            aDateTime.setHours(ah, am, 0, 0);
          }
          if (aDate.getMonth() === month && aDate.getFullYear() === year && aDateTime <= now) {
            if (a.justification_status !== 'Accepted' && !a.is_caught_up) {
              if (a.is_extra) {
                extraUnjustified++;
                absenceDetails.push({
                  id: a.id,
                  date: a.date,
                  reason: a.reason || 'Non justifié',
                  is_extra: true
                });
              } else {
                regUnjustified++;
                absenceDetails.push({
                  id: a.id,
                  date: a.date,
                  reason: a.reason || 'Non justifié',
                  is_extra: false
                });
              }
            }
          }
        });

        let finalExtraSessions = totalExtraSessions - extraUnjustified;
        if (finalExtraSessions < 0) finalExtraSessions = 0;

        const extraPay = finalExtraSessions * (teacher.hourly_rate || 0);
        const penaltyAmount = regUnjustified * (teacher.absence_penalty || 0);
        const netSalary = (teacher.base_salary || 0) + extraPay - penaltyAmount;

        resolve({
          date: `${monthName} ${year}`,
          month: monthName,
          year: year,
          base_salary: teacher.base_salary || 0,
          extra_hours: finalExtraSessions,
          hourly_rate: teacher.hourly_rate || 0,
          absences: regUnjustified,
          absence_details: absenceDetails,
          absence_penalty: teacher.absence_penalty || 0,
          total_penalty: penaltyAmount,
          extra_pay: extraPay,
          net_salary: netSalary > 0 ? netSalary : 0,
          extra_sessions: countedSessions,
          status: 'Paid'
        });
      } catch (procErr) {
        console.error("[Salary] Error processing data:", procErr);
        reject(procErr);
      }
    });
  });
};

// Teacher: Get my own salary and history (Fully Automated)
exports.getMySalary = (req, res) => {
  const teacherId = req.user.id;
  const now = new Date();
  console.log(`[Salary] Fetching for teacher ${teacherId} at ${now.toISOString()}`);
  
  const userQuery = "SELECT id, nom, prenom, grade, base_salary, hourly_rate, absence_penalty, created_at FROM users WHERE id = ?";
  db.query(userQuery, [teacherId], async (err, users) => {
    try {
      if (err) {
        console.error("[Salary] DB Error (User):", err);
        return res.status(500).json({ error: "Database error fetching user info" });
      }
      if (users.length === 0) {
        console.warn("[Salary] User not found:", teacherId);
        return res.status(404).json({ error: "User not found" });
      }
      
      const t = users[0];
      const teacherJoined = t.created_at ? new Date(t.created_at) : now;
      console.log(`[Salary] Teacher ${t.nom} joined at ${teacherJoined.toISOString()}`);
      
      // Get all sessions once to use in history calculation
      const sessionsQuery = "SELECT * FROM academic_sessions WHERE teacher_id = ? AND is_extra = TRUE";
      db.query(sessionsQuery, [t.id], async (err, sessions) => {
        if (err) {
          console.error("[Salary] DB Error (Sessions):", err);
          return res.status(500).json({ error: "Database error fetching sessions" });
        }

        try {
          console.log(`[Salary] Calculating current month for ${t.nom}`);
          // 1. Calculate Current Month (Dynamic)
          const currentData = await calculateSalaryForMonth(t, now.getMonth(), now.getFullYear(), sessions, now);

          // 2. Calculate History (All months since joining up to last month)
          const historyPromises = [];
          let iterDate = new Date(teacherJoined.getFullYear(), teacherJoined.getMonth(), 1);
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

          console.log(`[Salary] Calculating history from ${iterDate.toISOString()} to ${lastMonthDate.toISOString()}`);
          while (iterDate <= lastMonthDate) {
            historyPromises.push(calculateSalaryForMonth(t, iterDate.getMonth(), iterDate.getFullYear(), sessions, new Date(iterDate.getFullYear(), iterDate.getMonth() + 1, 0, 23, 59, 59)));
            iterDate.setMonth(iterDate.getMonth() + 1);
          }

          console.log(`[Salary] Waiting for ${historyPromises.length} history months...`);
          const historyResults = await Promise.all(historyPromises);
          historyResults.reverse();

          console.log(`[Salary] Success for teacher ${t.nom}`);
          res.json({ 
            current: currentData, 
            history: historyResults 
          });
        } catch (calcErr) {
          console.error("[Salary] Calculation error details:", calcErr);
          res.status(500).json({ error: "Calculation Error: " + calcErr.message });
        }
      });
    } catch (dbErr) {
      console.error("[Salary] Global parsing error:", dbErr);
      res.status(500).json({ error: "System Error: " + dbErr.message });
    }
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
              const sessionEnd = new Date(s.session_date);
              if (s.end_time && typeof s.end_time === 'string') {
                const [h, m] = s.end_time.split(':');
                sessionEnd.setHours(parseInt(h), parseInt(m), 0, 0);
              } else {
                sessionEnd.setHours(23, 59, 59, 999);
              }
              const now = new Date();
              if (sDate.getMonth() === mIndex && sDate.getFullYear() === Number(year) && sessionEnd <= now) extraSessions++;
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
