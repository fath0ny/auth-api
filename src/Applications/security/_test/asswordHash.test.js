import { describe, expect, it } from 'vitest';
import PasswordHash from '../PasswordHash.js';
 
describe('PasswordHash interface', () => {
  it('should throw error when invoke abstract behavior', async () => {
    // Arrange
    const passwordHash = new PasswordHash();
 
    // Action & Assert
    await expect(passwordHash.hash('dummy_password')).rejects.toThrow('PASSWORD_HASH.METHOD_NOT_IMPLEMENTED');
  });
});