const jwt = require('jsonwebtoken');

/**
 * auth(required = true)
 * - If required=true (default): missing/invalid token -> 401
 * - If required=false: continue even if unauthenticated (req.userId stays undefined)
 */
function auth(required = true) {
  return function (req, res, next) {
    const token = req.cookies?.accessToken; // MUST match userController cookie name
    if (!token) {
      if (required) return res.status(401).json({ message: 'Not authenticated' });
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.userId = payload.sub || payload.id || payload.userId;
      next();
    } catch {
      if (required) return res.status(401).json({ message: 'Invalid or expired token' });
      next();
    }
  };
}

module.exports = { auth };
