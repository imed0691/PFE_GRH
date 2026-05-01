const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'uploads', 'profiles');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Définition des routes
// La création de compte est protégée : il faut être connecté (verifyToken) ET être RH_MANAGER (checkRole)
router.post('/signup', verifyToken, checkRole(['RH_MANAGER']), authController.signup);
router.post('/login', authController.login);
router.get('/profile', verifyToken, authController.getProfile);

// Nouvelles routes pour la gestion des utilisateurs (Réservées au RH et Chefs de département)
router.get('/users', verifyToken, checkRole(['RH_MANAGER', 'DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT', 'DEAN', 'DOYEN', 'VICE_DEAN', 'VICE_DOYEN', 'RECTOR', 'RECTEUR', 'VICE_RECTOR', 'VICE_RECTEUR']), authController.getAllUsers);
router.delete('/users/:id', verifyToken, checkRole(['RH_MANAGER']), authController.deleteUser);
router.put('/change-password', verifyToken, authController.changePassword);
router.put('/profile', verifyToken, authController.updateProfile);

// Profile image routes
router.post('/profile-image', verifyToken, upload.single('image'), authController.uploadProfileImage);
router.delete('/profile-image', verifyToken, authController.deleteProfileImage);

// Route pour récupérer la liste des enseignants (Chef de département / RH)
router.get('/teachers', verifyToken, checkRole(['RH_MANAGER', 'DEPARTMENT_HEAD', 'CHEF_DEPARTEMENT']), authController.getTeachers);

module.exports = router;