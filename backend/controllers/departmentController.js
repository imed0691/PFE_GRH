const db = require('../config/db');

// Récupérer tous les départements
exports.getAllDepartments = (req, res) => {
  const query = "SELECT * FROM departments ORDER BY name ASC";
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Créer un département
exports.createDepartment = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Department name is required" });

  const query = "INSERT INTO departments (name) VALUES (?)";
  
  db.query(query, [name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "This department already exists" });
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: result.insertId, name, message: "Department created successfully" });
  });
};

// Supprimer un département
exports.deleteDepartment = (req, res) => {
  const deptId = req.params.id;
  const query = "DELETE FROM departments WHERE id = ?";
  
  db.query(query, [deptId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Department not found" });
    
    // NOTE : Grâce au "ON DELETE SET NULL" dans la base de données, 
    // les enseignants liés à ce département auront automatiquement leur department_id passé à NULL.
    res.json({ message: "Department deleted successfully" });
  });
};
