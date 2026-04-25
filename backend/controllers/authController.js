const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup logic
exports.signup = async (req, res) => {
  const { nom, prenom, role, email, password, department_id, grade, hourly_rate, absence_penalty } = req.body;
  
  // Unique role validation (Dean, Rector, Vice-Dean, Vice-Rector), case-insensitive
  const roleLower = role ? role.toLowerCase() : '';
  const uniqueRoles = [
    'dean', 'rector', 
    'vice dean', 'vice-dean', 'vice_dean', 
    'vice rector', 'vice-rector', 'vice_rector'
  ];

  if (uniqueRoles.includes(roleLower)) {
    const checkRoleQuery = "SELECT count(*) as count FROM users WHERE LOWER(role) = ?";
    try {
      const count = await new Promise((resolve, reject) => {
        db.query(checkRoleQuery, [roleLower], (err, results) => {
          if (err) reject(err);
          else resolve(results[0].count);
        });
      });
      
      if (count > 0) {
        return res.status(400).json({ message: `A ${role} already exists in the system.` });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Validation: only one Head of Department per department
  if (roleLower === 'department_head') {
    if (!department_id) {
      return res.status(400).json({ message: "A Head of Department must be assigned to a department." });
    }
    const checkChefQuery = "SELECT count(*) as count FROM users WHERE LOWER(role) = 'department_head' AND department_id = ?";
    try {
      const count = await new Promise((resolve, reject) => {
        db.query(checkChefQuery, [department_id], (err, results) => {
          if (err) reject(err);
          else resolve(results[0].count);
        });
      });
      
      if (count > 0) {
        return res.status(400).json({ message: "This department already has a Head of Department assigned." });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (nom, prenom, role, email, password, department_id, grade, hourly_rate, absence_penalty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    const gradeVal = roleLower === 'teacher' ? (grade || 'Teacher') : 'Teacher';
    const hrVal = roleLower === 'teacher' ? (hourly_rate || 0) : 0;
    const apVal = roleLower === 'teacher' ? (absence_penalty || 0) : 0;

    db.query(query, [nom, prenom, role, email, hashedPassword, department_id || null, gradeVal, hrVal, apVal], (err, result) => {
      if (err) {
        console.error("Signup DB Error:", err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "This email already exists" });
        return res.status(500).json({ message: err.message, error: err.message });
      }
      res.status(201).json({ message: "User created successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error hashing password" });
  }
};

// Login logic
exports.login = (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: "Login successful", 
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, role: user.role, department_id: user.department_id } 
    });
  });
};

// Get all users
exports.getAllUsers = (req, res) => {
  const query = `
    SELECT u.id, u.nom, u.prenom, u.email, u.role, u.department_id, d.name as department_name 
    FROM users u 
    LEFT JOIN departments d ON u.department_id = d.id 
    ORDER BY u.id DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Delete a user
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  const query = "DELETE FROM users WHERE id = ?";
  
  db.query(query, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "User deleted successfully" });
  });
};