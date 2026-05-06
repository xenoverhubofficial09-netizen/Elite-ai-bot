'use strict';

/**
 * Middleware to verify the ADMIN_KEY in the Authorization header.
 * Requires: Authorization: Bearer <ADMIN_KEY>
 */
function authMiddleware(req, res, next) {
  // Check if user is authenticated via Passport session
  if (req.isAuthenticated()) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  console.warn(`[AUTH] Unauthorized API access attempt to ${req.originalUrl}. AuthHeader: ${authHeader ? 'Present' : 'Missing'}`);

  // Fallback for ADMIN_KEY
  const adminKey = process.env.ADMIN_KEY || "elite_secure_123";
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === adminKey) {
    console.log('[AUTH] Authorized via legacy ADMIN_KEY');
    return next();
  }

  return res.status(403).json({ success: false, message: "Unauthorized: Please login with Discord" });
}

module.exports = authMiddleware;
