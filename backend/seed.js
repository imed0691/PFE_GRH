require('dotenv').config();
const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const defaultEmail = 'admin@univ.dz';
    const defaultPassword = 'admin'; // Vous changerez ce mot de passe plus tard

    // 1. Vérifier si un compte existe déjà
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [defaultEmail], async (err, results) => {
      if (err) {
        console.error("Erreur de connexion à la base de données :", err.message);
        process.exit(1);
      }

      if (results.length > 0) {
        console.log("⚠️ Le compte admin existe déjà ! Pas besoin de le recréer.");
        process.exit(0);
      }

      // 2. Si le compte n'existe pas, on hache le mot de passe
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const insertQuery = "INSERT INTO users (nom, prenom, role, email, password) VALUES (?, ?, ?, ?, ?)";
      
      const values = ['Admin', 'Principal', 'RH_MANAGER', defaultEmail, hashedPassword];

      // 3. Insérer le compte dans la BDD
      db.query(insertQuery, values, (insertErr, result) => {
        if (insertErr) {
          console.error("Erreur lors de la création du compte :", insertErr.message);
          process.exit(1);
        }
        console.log("✅ Compte 'Gestionnaire RH' créé avec succès !");
        console.log(`📧 Email: ${defaultEmail}`);
        console.log(`🔑 Mot de passe: ${defaultPassword}`);
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Erreur inattendue :", error.message);
    process.exit(1);
  }
};

seedAdmin();
