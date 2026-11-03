import { describe, expect, it } from 'vitest';
import NewAuth from '../NewAuth.js';

describe('NewAuth entity', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      accessToken: 'access_token',
    };

    // Action & Assert
    expect(() => new NewAuth(payload)).toThrowError('NEW_AUTH.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      accessToken: 'access_token',
      refreshToken: 123,
    };

    // Action & Assert
    expect(() => new NewAuth(payload)).toThrowError('NEW_AUTH.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewAuth object correctly', () => {
    // Arrange
    const payload = {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    };

    // Action
    const newAuth = new NewAuth(payload);

    // Assert
    expect(newAuth.accessToken).toEqual(payload.accessToken);
    expect(newAuth.refreshToken).toEqual(payload.refreshToken);
  });
});
