import { vi, describe, expect, it } from 'vitest';
import RegisterUser from '../../../Domains/users/entities/RegisterUser.js';
import RegisteredUser from '../../../Domains/users/entities/RegisteredUser.js';
import UserRepository from '../../../Domains/users/UserRepository.js';
import InvariantError from '../../../Commons/exceptions/InvariantError.js';
import PasswordHash from '../../security/PasswordHash.js';
import AddUserUseCase from '../AddUserUseCase.js';
 
describe('AddUserUseCase', () => {
  it('should orchestrating the add user action correctly', async () => {
    // Arrange
    const useCasePayload = {
      username: 'fathony',
      password: 'password',
      fullname: 'Mamang Racing',
    };
    const mockRegisteredUser = new RegisteredUser({
      id: 'user-123',
      username: useCasePayload.username,
      fullname: useCasePayload.fullname,
    });
 
    /** creating dependency of use case */
    const mockUserRepository = new UserRepository();
    const mockPasswordHash = new PasswordHash();
 
    /** mocking needed function */
    mockUserRepository.verifyAvailableUsername = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockPasswordHash.hash = vi.fn()
      .mockImplementation(() => Promise.resolve('encrypted_password'));
    mockUserRepository.addUser = vi.fn()
      .mockImplementation(() => Promise.resolve(mockRegisteredUser));
 
    /** creating use case instance */
    const getUserUseCase = new AddUserUseCase({
      userRepository: mockUserRepository,
      passwordHash: mockPasswordHash,
    });
 
    // Action
    const registeredUser = await getUserUseCase.execute(useCasePayload);
 
    // Assert
    expect(registeredUser).toStrictEqual(new RegisteredUser({
      id: 'user-123',
      username: useCasePayload.username,
      fullname: useCasePayload.fullname,
    }));
    expect(mockUserRepository.verifyAvailableUsername).toBeCalledWith(useCasePayload.username);
    expect(mockPasswordHash.hash).toBeCalledWith(useCasePayload.password);
    expect(mockUserRepository.addUser).toBeCalledWith(new RegisterUser({
      username: useCasePayload.username,
      password: 'encrypted_password',
      fullname: useCasePayload.fullname,
    }));
  });

  it('should not add user when username is not available', async () => {
    // Arrange
    const useCasePayload = {
      username: 'fathony',
      password: 'password',
      fullname: 'Mamang Racing',
    };

    /** creating dependency of use case */
    const mockUserRepository = new UserRepository();
    const mockPasswordHash = new PasswordHash();

    /** mocking needed function */
    mockUserRepository.verifyAvailableUsername = vi.fn()
      .mockImplementation(() => Promise.reject(new InvariantError('username tidak tersedia')));
    mockPasswordHash.hash = vi.fn();
    mockUserRepository.addUser = vi.fn();

    /** creating use case instance */
    const addUserUseCase = new AddUserUseCase({
      userRepository: mockUserRepository,
      passwordHash: mockPasswordHash,
    });

    // Action and Assert
    await expect(addUserUseCase.execute(useCasePayload))
      .rejects.toThrow(InvariantError);
    expect(mockUserRepository.verifyAvailableUsername).toBeCalledWith(useCasePayload.username);
    expect(mockPasswordHash.hash).not.toBeCalled();
    expect(mockUserRepository.addUser).not.toBeCalled();
  });
});