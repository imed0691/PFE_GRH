// Ce middleware vérifie si l'utilisateur possède le bon rôle
const checkRole = (rolesAutorises) => {
  return (req, res, next) => {
    // req.user est rempli par authMiddleware.js juste avant
    if (!req.user || !rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit. Vous n'avez pas les permissions nécessaires." });
    }
    next();
  };
};

module.exports = checkRole;
