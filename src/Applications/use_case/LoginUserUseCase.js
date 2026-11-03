import NewAuth from '../../Domains/authentications/entities/NewAuth.js';
import AuthenticationError from '../../Commons/exceptions/AuthenticationError.js';

class LoginUserUseCase {
  constructor({
    userRepository,
    authenticationRepository,
    authenticationTokenManager,
    passwordHash,
  }) {
    this._userRepository = userRepository;
    this._authenticationRepository = authenticationRepository;
    this._authenticationTokenManager = authenticationTokenManager;
    this._passwordHash = passwordHash;
  }

  async execute(useCasePayload) {
    const { username, password } = useCasePayload;

    const user = await this._userRepository.getUserByUsername(username);

    const match = await this._passwordHash.compare(password, user.password);
    if (!match) {
      throw new AuthenticationError('kredensial yang Anda berikan salah');
    }

    const payload = { id: user.id, username };

    const accessToken = await this._authenticationTokenManager.createAccessToken(payload);
    const refreshToken = await this._authenticationTokenManager.createRefreshToken(payload);

    await this._authenticationRepository.addToken(refreshToken);

    return new NewAuth({ accessToken, refreshToken });
  }
}

export default LoginUserUseCase;
