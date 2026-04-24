const db = require('../config/db');

// RH: Calculer les salaires
exports.calculateSalaries = (req, res) => {
  const query = "SELECT id, nom, prenom, role, volume_horaire, absences, grade, hourly_rate, absence_penalty, base_salary, extra_hours FROM users WHERE role IN ('TEACHER', 'ENSEIGNANT')";
  
  db.query(query, (err, teachers) => {
    if (err) return res.status(500).json({ error: err.message });

    const salaries = teachers.map(t => {
      const penaltyAmount = t.absences * (t.absence_penalty || 0);
      const extraPay = (t.extra_hours || 0) * (t.hourly_rate || 0);
      const calculatedSalary = (t.base_salary || 0) + extraPay - penaltyAmount;

      return {
        id: t.id,
        nom: t.nom,
        prenom: t.prenom,
        grade: t.grade || 'Teacher',
        volume_horaire: t.volume_horaire,
        absences: t.absences,
        base_salary: t.base_salary || 0,
        extra_hours: t.extra_hours || 0,
        hourly_rate: t.hourly_rate || 0,
        absence_penalty: t.absence_penalty || 0,
        penalty_amount: penaltyAmount,
        final_salary: calculatedSalary > 0 ? calculatedSalary : 0
      };
    });

    res.json(salaries);
  });
};

// RH: Update Base Salary and Extra Hours
exports.updateSalary = (req, res) => {
  const teacherId = req.params.id;
  const { base_salary, extra_hours } = req.body;

  const query = "UPDATE users SET base_salary = ?, extra_hours = ? WHERE id = ?";
  db.query(query, [base_salary, extra_hours, teacherId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Salary information updated successfully" });
  });
};
