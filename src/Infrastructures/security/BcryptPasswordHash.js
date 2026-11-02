import PasswordHash from '../../Applications/security/PasswordHash.js';

class BcryptPasswordHash extends PasswordHash {
  constructor(bcrypt, saltround = 10) {
    super();
    this._bcrypt = bcrypt;
    this._saltround = saltround;
  }

  async hash(password) {
    return this._bcrypt.hash(password, this._saltround);
  }
}

export default BcryptPasswordHash;