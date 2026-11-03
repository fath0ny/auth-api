class RefreshAuthenticationUseCase {
  constructor({ authenticationRepository, authenticationTokenManager }) {
    this._authenticationRepository = authenticationRepository;
    this._authenticationTokenManager = authenticationTokenManager;
  }

  async execute(useCasePayload) {
    const { refreshToken } = useCasePayload;

    await this._authenticationTokenManager.verifyRefreshToken(refreshToken);
    await this._authenticationRepository.checkAvailabilityToken(refreshToken);

    const { id, username } = await this._authenticationTokenManager.decodePayload(refreshToken);

    return this._authenticationTokenManager.createAccessToken({ id, username });
  }
}

export default RefreshAuthenticationUseCase;
