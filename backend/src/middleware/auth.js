// JWT auth middleware
const jwt = require('jsonwebtoken');
const ApiError = require('../lib/apiError');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing Authorization header'));
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    return next();
  } catch (e) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { authRequired };