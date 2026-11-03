import { vi, describe, expect, it } from 'vitest';
import NewAuth from '../../../Domains/authentications/entities/NewAuth.js';
import AuthenticationRepository from '../../../Domains/authentications/AuthenticationRepository.js';
import UserRepository from '../../../Domains/users/UserRepository.js';
import AuthenticationTokenManager from '../../security/AuthenticationTokenManager.js';
import PasswordHash from '../../security/PasswordHash.js';
import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';
import InvariantError from '../../../Commons/exceptions/InvariantError.js';
import LoginUserUseCase from '../LoginUserUseCase.js';

describe('LoginUserUseCase', () => {
  it('should orchestrating the login user action correctly', async () => {
    // Arrange
    const useCasePayload = {
      username: 'fathony',
      password: 'secret',
    };

    const mockUserRepository = new UserRepository();
    const mockAuthenticationRepository = new AuthenticationRepository();
    const mockAuthenticationTokenManager = new AuthenticationTokenManager();
    const mockPasswordHash = new PasswordHash();

    mockUserRepository.getUserByUsername = vi.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'user-123',
        password: 'encrypted_password',
      }));
    mockPasswordHash.compare = vi.fn()
      .mockImplementation(() => Promise.resolve(true));
    mockAuthenticationTokenManager.createAccessToken = vi.fn()
      .mockImplementation(() => Promise.resolve('access_token'));
    mockAuthenticationTokenManager.createRefreshToken = vi.fn()
      .mockImplementation(() => Promise.resolve('refresh_token'));
    mockAuthenticationRepository.addToken = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const loginUserUseCase = new LoginUserUseCase({
      userRepository: mockUserRepository,
      authenticationRepository: mockAuthenticationRepository,
      authenticationTokenManager: mockAuthenticationTokenManager,
      passwordHash: mockPasswordHash,
    });

    // Action
    const newAuth = await loginUserUseCase.execute(useCasePayload);

    // Assert
    expect(newAuth).toStrictEqual(new NewAuth({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    }));
    expect(mockUserRepository.getUserByUsername).toBeCalledWith(useCasePayload.username);
    expect(mockPasswordHash.compare).toBeCalledWith(useCasePayload.password, 'encrypted_password');
    expect(mockAuthenticationTokenManager.createAccessToken).toBeCalledWith({
      id: 'user-123',
      username: useCasePayload.username,
    });
    expect(mockAuthenticationTokenManager.createRefreshToken).toBeCalledWith({
      id: 'user-123',
      username: useCasePayload.username,
    });
    expect(mockAuthenticationRepository.addToken).toBeCalledWith('refresh_token');
  });

  it('should throw InvariantError when username not registered', async () => {
    // Arrange
    const useCasePayload = {
      username: 'unknown',
      password: 'secret',
    };

    const mockUserRepository = new UserRepository();
    const mockAuthenticationRepository = new AuthenticationRepository();
    const mockAuthenticationTokenManager = new AuthenticationTokenManager();
    const mockPasswordHash = new PasswordHash();

    mockUserRepository.getUserByUsername = vi.fn()
      .mockImplementation(() => Promise.reject(new InvariantError('username tidak terdaftar')));

    const loginUserUseCase = new LoginUserUseCase({
      userRepository: mockUserRepository,
      authenticationRepository: mockAuthenticationRepository,
      authenticationTokenManager: mockAuthenticationTokenManager,
      passwordHash: mockPasswordHash,
    });

    // Action & Assert
    await expect(loginUserUseCase.execute(useCasePayload)).rejects.toThrowError(InvariantError);
  });

  it('should throw AuthenticationError when password is wrong', async () => {
    // Arrange
    const useCasePayload = {
      username: 'fathony',
      password: 'wrong_password',
    };

    const mockUserRepository = new UserRepository();
    const mockAuthenticationRepository = new AuthenticationRepository();
    const mockAuthenticationTokenManager = new AuthenticationTokenManager();
    const mockPasswordHash = new PasswordHash();

    mockUserRepository.getUserByUsername = vi.fn()
      .mockImplementation(() => Promise.resolve({
        id: 'user-123',
        password: 'encrypted_password',
      }));
    mockPasswordHash.compare = vi.fn()
      .mockImplementation(() => Promise.resolve(false));
    mockAuthenticationTokenManager.createAccessToken = vi.fn();
    mockAuthenticationRepository.addToken = vi.fn();

    const loginUserUseCase = new LoginUserUseCase({
      userRepository: mockUserRepository,
      authenticationRepository: mockAuthenticationRepository,
      authenticationTokenManager: mockAuthenticationTokenManager,
      passwordHash: mockPasswordHash,
    });

    // Action & Assert
    await expect(loginUserUseCase.execute(useCasePayload)).rejects.toThrowError(AuthenticationError);
    expect(mockAuthenticationTokenManager.createAccessToken).not.toBeCalled();
    expect(mockAuthenticationRepository.addToken).not.toBeCalled();
  });
});
