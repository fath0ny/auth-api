import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import InvariantError from '../../../Commons/exceptions/InvariantError.js';
import RegisterUser from '../../../Domains/users/entities/RegisterUser.js';
import RegisteredUser from '../../../Domains/users/entities/RegisteredUser.js';
import pool from '../../database/postgres/pool.js';
import UserRepositoryPostgres from '../UserRepositoryPostgres.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';
 
describe('UserRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });
 
  afterAll(async () => {
    await pool.end();
  });
 
  describe('verifyAvailableUsername function', () => {
    it('should throw InvariantError when username not available', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fathony' }); // memasukan user baru dengan username fathony
      const userRepositoryPostgres = new UserRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(userRepositoryPostgres.verifyAvailableUsername('fathony')).rejects.toThrowError(InvariantError);
    });
 
    it('should not throw InvariantError when username available', async () => {
      // Arrange
      const userRepositoryPostgres = new UserRepositoryPostgres(pool, {});
 
      // Action & Assert
      await expect(userRepositoryPostgres.verifyAvailableUsername('fathony')).resolves.not.toThrowError(InvariantError);
    });
  });
 
  describe('addUser function', () => {
    it('should persist register user', async () => {
      // Arrange
      const registerUser = new RegisterUser({
        username: 'fathony',
        password: 'secret',
        fullname: 'Mamang Racing',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const userRepositoryPostgres = new UserRepositoryPostgres(pool, fakeIdGenerator);
 
      // Action
      await userRepositoryPostgres.addUser(registerUser);
 
      // Assert
      const users = await UsersTableTestHelper.findUsersById('user-123');
      expect(users).toHaveLength(1);
    });
 
    it('should return registered user correctly', async () => {
      // Arrange
      const registerUser = new RegisterUser({
        username: 'fathony',
        password: 'secret',
        fullname: 'Mamang Racing',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const userRepositoryPostgres = new UserRepositoryPostgres(pool, fakeIdGenerator);
 
      // Action
      const registeredUser = await userRepositoryPostgres.addUser(registerUser);
 
      // Assert
      expect(registeredUser).toStrictEqual(new RegisteredUser({
        id: 'user-123',
        username: 'fathony',
        fullname: 'Mamang Racing',
      }));
    });
  });
});