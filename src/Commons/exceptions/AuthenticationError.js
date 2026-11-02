import ClientError from './ClientError.js';
 
class AuthenticationError extends ClientError {
  constructor(message) {
    super(message);
    this.statusCode = 401;
    this.name = 'AuthenticationError';
  }
}
 
export default AuthenticationError;