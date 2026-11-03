import { vi, describe, expect, it } from 'vitest';
import AuthenticationRepository from '../../../Domains/authentications/AuthenticationRepository.js';
import LogoutUserUseCase from '../LogoutUserUseCase.js';

describe('LogoutUserUseCase', () => {
  it('should orchestrating the logout user action correctly', async () => {
    // Arrange
    const useCasePayload = {
      refreshToken: 'refresh_token',
    };

    const mockAuthenticationRepository = new AuthenticationRepository();
    mockAuthenticationRepository.checkAvailabilityToken = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockAuthenticationRepository.deleteToken = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const logoutUserUseCase = new LogoutUserUseCase({
      authenticationRepository: mockAuthenticationRepository,
    });

    // Action
    await logoutUserUseCase.execute(useCasePayload);

    // Assert
    expect(mockAuthenticationRepository.checkAvailabilityToken).toBeCalledWith(useCasePayload.refreshToken);
    expect(mockAuthenticationRepository.deleteToken).toBeCalledWith(useCasePayload.refreshToken);
  });
});
