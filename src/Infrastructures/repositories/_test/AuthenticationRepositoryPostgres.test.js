import { describe, expect, it, afterEach, afterAll } from 'vitest';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import InvariantError from '../../../Commons/exceptions/InvariantError.js';
import pool from '../../database/postgres/pool.js';
import AuthenticationRepositoryPostgres from '../AuthenticationRepositoryPostgres.js';

describe('AuthenticationRepositoryPostgres', () => {
  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addToken function', () => {
    it('should persist refresh token', async () => {
      // Arrange
      const authenticationRepositoryPostgres = new AuthenticationRepositoryPostgres(pool);

      // Action
      await authenticationRepositoryPostgres.addToken('refresh_token');

      // Assert
      const tokens = await AuthenticationsTableTestHelper.findToken('refresh_token');
      expect(tokens).toHaveLength(1);
    });
  });

  describe('checkAvailabilityToken function', () => {
    it('should throw InvariantError when token not available', async () => {
      // Arrange
      const authenticationRepositoryPostgres = new AuthenticationRepositoryPostgres(pool);

      // Action & Assert
      await expect(authenticationRepositoryPostgres.checkAvailabilityToken('refresh_token'))
        .rejects.toThrowError(InvariantError);
    });

    it('should not throw InvariantError when token available', async () => {
      // Arrange
      await AuthenticationsTableTestHelper.addUser('refresh_token');
      const authenticationRepositoryPostgres = new AuthenticationRepositoryPostgres(pool);

      // Action & Assert
      await expect(authenticationRepositoryPostgres.checkAvailabilityToken('refresh_token'))
        .resolves.not.toThrowError(InvariantError);
    });
  });

  describe('deleteToken function', () => {
    it('should delete refresh token from database', async () => {
      // Arrange
      await AuthenticationsTableTestHelper.addUser('refresh_token');
      const authenticationRepositoryPostgres = new AuthenticationRepositoryPostgres(pool);

      // Action
      await authenticationRepositoryPostgres.deleteToken('refresh_token');

      // Assert
      const tokens = await AuthenticationsTableTestHelper.findToken('refresh_token');
      expect(tokens).toHaveLength(0);
    });
  });
});
