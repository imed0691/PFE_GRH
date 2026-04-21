const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Définition des routes
// La création de compte est protégée : il faut être connecté (verifyToken) ET être RH_MANAGER (checkRole)
router.post('/signup', verifyToken, checkRole(['RH_MANAGER']), authController.signup);
router.post('/login', authController.login);

// Nouvelles routes pour la gestion des utilisateurs (Réservées au RH)
router.get('/users', verifyToken, checkRole(['RH_MANAGER']), authController.getAllUsers);
router.delete('/users/:id', verifyToken, checkRole(['RH_MANAGER']), authController.deleteUser);

module.exports = router;