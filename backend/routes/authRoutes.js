const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Définition des routes
// La création de compte est protégée : il faut être connecté (verifyToken) ET être RH_MANAGER (checkRole)
router.post('/signup', verifyToken, checkRole(['RH_MANAGER']), authController.signup);
router.post('/login', authController.login);

// Nouvelles routes pour la gestion des utilisateurs (Réservées au RH et Chefs de département)
router.get('/users', verifyToken, checkRole(['RH_MANAGER', 'DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN', 'RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR']), authController.getAllUsers);
router.delete('/users/:id', verifyToken, checkRole(['RH_MANAGER']), authController.deleteUser);

module.exports = router;