const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Signup logic
exports.signup = async (req, res) => {
  const { nom, prenom, role, email, password, department_id, grade, hourly_rate, absence_penalty, volume_horaire, base_salary } = req.body;
  
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
    const query = "INSERT INTO users (nom, prenom, role, email, password, department_id, grade, hourly_rate, absence_penalty, volume_horaire, base_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    const gradeVal = grade || 'Teacher';
    const hrVal = roleLower === 'teacher' ? (hourly_rate || 0) : 0;
    const apVal = roleLower === 'teacher' ? (absence_penalty || 0) : 0;

    db.query(query, [nom, prenom, role, email, hashedPassword, department_id || null, gradeVal, hrVal, apVal, volume_horaire || 192, base_salary || 0], (err, result) => {
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
      { id: user.id, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: "Login successful", 
      token,
      user: { 
        id: user.id, 
        nom: user.nom, 
        prenom: user.prenom, 
        role: user.role, 
        department_id: user.department_id,
        must_change_password: user.must_change_password,
        profile_image: user.profile_image
      } 
    });
  });
};

// Get all users
exports.getAllUsers = (req, res) => {
  const query = `
    SELECT u.id, u.nom, u.prenom, u.email, u.role, u.department_id, u.grade, d.name as department_name 
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

// Helper function for password validation
const validatePassword = (pass) => {
  return pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass);
};

// Change Password logic
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!newPassword || !validatePassword(newPassword)) {
    return res.status(400).json({ message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number." });
  }

  try {
    // 1. Get current user password
    const userQuery = "SELECT password, must_change_password FROM users WHERE id = ?";
    db.query(userQuery, [userId], async (err, results) => {
      if (err || results.length === 0) return res.status(500).json({ message: "User not found" });
      
      const user = results[0];

      // 2. If it's not the first login, verify current password
      if (!user.must_change_password) {
        if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: "Incorrect current password" });
      }

      // 3. Hash and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const query = "UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?";
      
      db.query(query, [hashedPassword, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Password updated successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing request" });
  }
};

// Update Profile logic
exports.updateProfile = (req, res) => {
  const { nom, prenom } = req.body;
  const userId = req.user.id;

  if (!nom || !prenom) {
    return res.status(400).json({ message: "Name and surname are required" });
  }

  const query = "UPDATE users SET nom = ?, prenom = ? WHERE id = ?";
  db.query(query, [nom, prenom, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Profile updated successfully", user: { nom, prenom } });
  });
};

// Get teachers for marking absences (Dept Head or HR)
exports.getTeachers = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role ? req.user.role.toUpperCase().replace(/\s/g, '_') : '';

  let query = "SELECT id, nom, prenom, department_id FROM users WHERE LOWER(role) IN ('teacher', 'enseignant')";
  
  if (userRole === 'DEPARTMENT_HEAD' || userRole === 'CHEF_DEPARTEMENT') {
    db.query('SELECT department_id FROM users WHERE id = ?', [userId], (err, deptRes) => {
      if (err || deptRes.length === 0 || !deptRes[0].department_id) {
        // Fallback or empty if no department assigned to head
        return res.json([]);
      }
      const headDeptId = deptRes[0].department_id;
      db.query(query + " AND department_id = ?", [headDeptId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    });
  } else {
    // For HR or others, return all teachers
    db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }
};

// Upload profile image
exports.uploadProfileImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const userId = req.user.id;
  const imagePath = `/uploads/profiles/${req.file.filename}`;

  // 1. Delete old image if exists
  db.query('SELECT profile_image FROM users WHERE id = ?', [userId], (err, results) => {
    if (!err && results.length > 0 && results[0].profile_image) {
      const oldPath = path.join(__dirname, '..', results[0].profile_image);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch(e) {}
      }
    }

    // 2. Update DB
    db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imagePath, userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Profile image updated", profile_image: imagePath });
    });
  });
};

// Delete profile image
exports.deleteProfileImage = (req, res) => {
  const userId = req.user.id;

  db.query('SELECT profile_image FROM users WHERE id = ?', [userId], (err, results) => {
    if (!err && results.length > 0 && results[0].profile_image) {
      const oldPath = path.join(__dirname, '..', results[0].profile_image);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch(e) {}
      }
    }

    db.query('UPDATE users SET profile_image = NULL WHERE id = ?', [userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Profile image removed" });
    });
  });
};

// Get current user profile
exports.getProfile = (req, res) => {
  const userId = req.user.id;
  const query = "SELECT id, nom, prenom, role, department_id, grade, profile_image FROM users WHERE id = ?";
  
  db.query(query, [userId], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: "User not found" });
    res.json(results[0]);
  });
};
