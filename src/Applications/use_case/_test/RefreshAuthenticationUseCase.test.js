import { vi, describe, expect, it } from 'vitest';
import AuthenticationRepository from '../../../Domains/authentications/AuthenticationRepository.js';
import AuthenticationTokenManager from '../../security/AuthenticationTokenManager.js';
import RefreshAuthenticationUseCase from '../RefreshAuthenticationUseCase.js';

describe('RefreshAuthenticationUseCase', () => {
  it('should orchestrating the refresh authentication action correctly', async () => {
    // Arrange
    const useCasePayload = {
      refreshToken: 'refresh_token',
    };

    const mockAuthenticationRepository = new AuthenticationRepository();
    const mockAuthenticationTokenManager = new AuthenticationTokenManager();

    mockAuthenticationTokenManager.verifyRefreshToken = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockAuthenticationRepository.checkAvailabilityToken = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockAuthenticationTokenManager.decodePayload = vi.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'user-123',
        username: 'fathony',
      }));
    mockAuthenticationTokenManager.createAccessToken = vi.fn()
      .mockImplementation(() => Promise.resolve('access_token'));

    const refreshAuthenticationUseCase = new RefreshAuthenticationUseCase({
      authenticationRepository: mockAuthenticationRepository,
      authenticationTokenManager: mockAuthenticationTokenManager,
    });

    // Action
    const accessToken = await refreshAuthenticationUseCase.execute(useCasePayload);

    // Assert
    expect(accessToken).toEqual('access_token');
    expect(mockAuthenticationTokenManager.verifyRefreshToken).toBeCalledWith(useCasePayload.refreshToken);
    expect(mockAuthenticationRepository.checkAvailabilityToken).toBeCalledWith(useCasePayload.refreshToken);
    expect(mockAuthenticationTokenManager.createAccessToken).toBeCalledWith({
      id: 'user-123',
      username: 'fathony',
    });
  });
});
