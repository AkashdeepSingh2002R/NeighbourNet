const jwt = require('jsonwebtoken');

function auth() {
  return (req, res, next) => {
    try {
      const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const token = req.cookies?.accessToken || bearer;
      if (!token) return res.status(401).json({ message: 'Unauthorized' });
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.userId = payload?.sub || payload?.id || payload?._id;
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

module.exports = { auth };
