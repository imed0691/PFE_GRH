const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Logique d'inscription
exports.signup = async (req, res) => {
  const { nom, prenom, role, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (nom, prenom, role, email, password) VALUES (?, ?, ?, ?, ?)";
    
    db.query(query, [nom, prenom, role, email, hashedPassword], (err, result) => {
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

    res.json({ 
      message: "Login successful", 
      user: { id: user.id, nom: user.nom, prenom: user.prenom, role: user.role } 
    });
  });
};