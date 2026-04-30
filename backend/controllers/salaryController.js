const db = require('../config/db');

// RH: Calculer les salaires
exports.calculateSalaries = (req, res) => {
  const query = `
    SELECT 
      u.id, u.nom, u.prenom, u.role, u.volume_horaire, u.grade, u.hourly_rate, u.absence_penalty, u.base_salary, u.extra_hours,
      (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND COALESCE(justification_status, 'None') != 'Accepted' AND is_caught_up = FALSE) as unjustified_absences
    FROM users u 
    WHERE u.role IN ('TEACHER', 'ENSEIGNANT')
  `;
  
  db.query(query, (err, teachers) => {
    if (err) return res.status(500).json({ error: err.message });

    const salaries = teachers.map(t => {
      const penaltyAmount = t.unjustified_absences * (t.absence_penalty || 0);
      const extraPay = (t.extra_hours || 0) * (t.hourly_rate || 0);
      const calculatedSalary = (t.base_salary || 0) + extraPay - penaltyAmount;

      return {
        id: t.id,
        nom: t.nom,
        prenom: t.prenom,
        grade: t.grade || 'Teacher',
        volume_horaire: t.volume_horaire,
        absences: t.unjustified_absences,
        base_salary: t.base_salary || 0,
        extra_hours: t.extra_hours || 0,
        hourly_rate: t.hourly_rate || 0,
        absence_penalty: t.absence_penalty || 0,
        total_penalty: penaltyAmount,
        net_salary: calculatedSalary > 0 ? calculatedSalary : 0
      };
    });

    res.json(salaries);
  });
};

// RH: Recalculate (Just a placeholder if calculations are dynamic, or can be used to sync)
exports.recalculateSalary = (req, res) => {
  // Logic is already dynamic in calculateSalaries, 
  // but we provide the endpoint to satisfy the frontend's 'Adjust' action.
  res.json({ message: "Salary recalculated successfully" });
};

// RH: Update Salary Components
exports.updateSalary = (req, res) => {
  const teacherId = req.params.id;
  const { base_salary, extra_hours, hourly_rate, absence_penalty } = req.body;

  const query = "UPDATE users SET base_salary = ?, extra_hours = ?, hourly_rate = ?, absence_penalty = ? WHERE id = ?";
  db.query(query, [base_salary, extra_hours, hourly_rate, absence_penalty, teacherId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Salary information updated successfully" });
  });
};
