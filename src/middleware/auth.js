'use strict';

/**
 * Middleware to verify the ADMIN_KEY in the Authorization header.
 * Rejects requests that do not match the key defined in .env.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    console.error('[SECURITY CRITICAL] ADMIN_KEY is not defined in .env! Blocking all requests.');
    return res.status(500).json({ 
      success: false, 
      message: "Server configuration error. Contact administrator." 
    });
  }

  if (!authHeader || authHeader !== adminKey) {
    return res.status(403).json({ 
      success: false, 
      message: "Unauthorized: Access denied." 
    });
  }

  next();
}

module.exports = authMiddleware;
