const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const absenceRoutes = require('./routes/absenceRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const documentRoutes = require('./routes/documentRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const classRoutes = require('./routes/classRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Utilisation des routes
app.use('/api', authRoutes);
app.use('/api', departmentRoutes);
app.use('/api', sessionRoutes);
app.use('/api', absenceRoutes);
app.use('/api', reminderRoutes);
app.use('/api', salaryRoutes);
app.use('/api', promotionRoutes);
app.use('/api', documentRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', notificationRoutes);
app.use('/api', classRoutes);

// Route de test pour vérifier la liaison avec le frontend
app.get('/api/hello', (req, res) => {
  res.json({ message: 'ANTIGRAVITY BACKEND V2 - LOGS ACTIVE' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});