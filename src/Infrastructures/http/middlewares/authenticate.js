import jwt from 'jsonwebtoken';
import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';

/**
 * Express middleware yang memverifikasi access token (JWT) pada header
 * Authorization: Bearer <access_token>. Jika valid, payload token
 * (minimal berisi `id` pemilik token) disematkan pada `req.user`.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    const error = new AuthenticationError('Missing authentication');
    return res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    req.user = decoded;
    return next();
  } catch (error) {
    const authenticationError = new AuthenticationError('Missing authentication');
    return res.status(authenticationError.statusCode).json({
      status: 'fail',
      message: authenticationError.message,
    });
  }
};

export default authenticate;
