// server/middleware/auth.js
const jwt = require('jsonwebtoken');

function auth(required = true) {
  return (req, res, next) => {
    // Prefer Authorization: Bearer <token>, otherwise fall back to cookie "accessToken"
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearer || req.cookies?.accessToken;

    if (!token) {
      if (required) return res.status(401).json({ message: 'Not authenticated' });
      req.userId = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.userId = payload.sub;
      next();
    } catch {
      if (required) return res.status(401).json({ message: 'Invalid or expired token' });
      req.userId = null;
      next();
    }
  };
}

module.exports = { auth };
