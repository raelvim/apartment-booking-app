const jwt = require('jsonwebtoken');

function createAdminAuth(jwtSecret) {
  if (!jwtSecret) {
    throw new Error('JWT secret is required to create admin auth middleware');
  }

  return function checkAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
}

module.exports = { createAdminAuth };
