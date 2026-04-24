const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const absenceRoutes = require('./routes/absenceRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const salaryRoutes = require('./routes/salaryRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Utilisation des routes
app.use('/api', authRoutes);
app.use('/api', departmentRoutes);
app.use('/api', sessionRoutes);
app.use('/api', absenceRoutes);
app.use('/api', reminderRoutes);
app.use('/api', salaryRoutes);

// Route de test pour vérifier la liaison avec le frontend
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello depuis le serveur Node.js !' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});