import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import InvariantError from '../../../Commons/exceptions/InvariantError.js';
import JwtTokenManager from '../JwtTokenManager.js';

describe('JwtTokenManager', () => {
  it('should create access token correctly', async () => {
    // Arrange
    const payload = { id: 'user-123', username: 'fathony' };
    const jwtTokenManager = new JwtTokenManager(jwt);

    // Action
    const accessToken = await jwtTokenManager.createAccessToken(payload);

    // Assert
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
    expect(decoded.id).toEqual(payload.id);
    expect(decoded.username).toEqual(payload.username);
  });

  it('should create refresh token correctly', async () => {
    // Arrange
    const payload = { id: 'user-123', username: 'fathony' };
    const jwtTokenManager = new JwtTokenManager(jwt);

    // Action
    const refreshToken = await jwtTokenManager.createRefreshToken(payload);

    // Assert
    const decoded = await jwtTokenManager.decodePayload(refreshToken);
    expect(decoded.id).toEqual(payload.id);
    expect(decoded.username).toEqual(payload.username);
  });

  it('should throw InvariantError when refresh token is invalid', async () => {
    // Arrange
    const jwtTokenManager = new JwtTokenManager(jwt);

    // Action & Assert
    await expect(jwtTokenManager.verifyRefreshToken('invalid-token'))
      .rejects.toThrowError(InvariantError);
  });
});
