const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Logique d'inscription
exports.signup = async (req, res) => {
  const { nom, prenom, role, email, password, department_id } = req.body;
  
  // Vérification de rôles uniques (Doyen, Recteur, Vice-Doyen, Vice-Recteur), insensible à la casse
  const roleLower = role ? role.toLowerCase() : '';
  const uniqueRoles = [
    'doyen', 'recteur', 
    'vice doyen', 'vice-doyen', 'vice_doyen', 
    'vice recteur', 'vice-recteur', 'vice_recteur'
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
        return res.status(400).json({ message: `Impossible : Un ${role} existe déjà dans le système.` });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Vérification: un seul Chef de Département par département
  if (roleLower === 'chef_departement') {
    if (!department_id) {
      return res.status(400).json({ message: "Un Chef de Département doit obligatoirement être assigné à un département." });
    }
    const checkChefQuery = "SELECT count(*) as count FROM users WHERE LOWER(role) = 'chef_departement' AND department_id = ?";
    try {
      const count = await new Promise((resolve, reject) => {
        db.query(checkChefQuery, [department_id], (err, results) => {
          if (err) reject(err);
          else resolve(results[0].count);
        });
      });
      
      if (count > 0) {
        return res.status(400).json({ message: "Désolé, ce département a déjà un Chef de Département assigné !" });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (nom, prenom, role, email, password, department_id) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(query, [nom, prenom, role, email, hashedPassword, department_id || null], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "This email already exists" });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "User created successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error hashing password" });
  }
};

// Logique de connexion
exports.login = (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    // Génération du token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: "Login successful", 
      token, // On renvoie le token au frontend
      user: { id: user.id, nom: user.nom, prenom: user.prenom, role: user.role } 
    });
  });
};

// Récupérer tous les utilisateurs
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

// Supprimer un utilisateur
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  const query = "DELETE FROM users WHERE id = ?";
  
  db.query(query, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "User deleted successfully" });
  });
};