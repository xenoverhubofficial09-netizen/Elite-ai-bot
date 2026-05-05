'use strict';

/**
 * Middleware to verify the ADMIN_KEY in the Authorization header.
 * Requires: Authorization: Bearer <ADMIN_KEY>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    console.error('[SECURITY] ADMIN_KEY is not defined in .env');
    return res.status(500).json({ success: false, message: "Server Configuration Error" });
  }

  // Expecting format: Bearer YOUR_KEY
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== adminKey) {
    return res.status(403).json({ success: false, message: "Unauthorized: Invalid Bearer Token" });
  }

  next();
}

module.exports = authMiddleware;
