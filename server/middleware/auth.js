const jwt = require('jsonwebtoken');

function auth(required = true) {
  return (req, res, next) => {
    const token = req.cookies?.at;
    if (!token) {
      if (required) return res.status(401).json({ message: 'Not authenticated' });
      req.userId = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      req.userId = payload.sub;
      next();
    } catch (e) {
      if (required) return res.status(401).json({ message: 'Invalid token' });
      req.userId = null;
      next();
    }
  }
}
module.exports = { auth };
