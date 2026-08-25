const { normalizeRole } = require('../utils/roleUtils');

/**
 * Middleware factory that restricts a route to specific roles.
 * Must run AFTER authenticateToken, since it relies on req.user being set.
 *
 * Usage:
 *   router.post('/x', authenticateToken, requireRole('coordinator'), handler);
 */
const requireRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = normalizeRole(req.user.role);
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }

    next();
  };
};

module.exports = requireRole;
