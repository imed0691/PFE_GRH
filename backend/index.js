const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Utilisation des routes
app.use('/api', authRoutes);

// Route de test pour vérifier la liaison avec le frontend
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello depuis le serveur Node.js !' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});