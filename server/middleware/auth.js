const jwt = require('jsonwebtoken');

function auth(required = true) {
  return function (req, res, next) {
    const token = req.cookies?.accessToken; // MUST match cookie name set above
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
