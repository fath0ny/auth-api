import { describe, expect, it } from 'vitest';
import AuthorizationError from '../AuthorizationError.js';
import ClientError from '../ClientError.js';

describe('AuthorizationError', () => {
  it('should create error with status code 403', () => {
    const authorizationError = new AuthorizationError('tidak berhak');

    expect(authorizationError).toBeInstanceOf(ClientError);
    expect(authorizationError.statusCode).toEqual(403);
    expect(authorizationError.message).toEqual('tidak berhak');
    expect(authorizationError.name).toEqual('AuthorizationError');
  });
});
