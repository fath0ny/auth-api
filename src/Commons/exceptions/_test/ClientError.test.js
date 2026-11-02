import { describe, expect, it } from 'vitest';
import ClientError from '../ClientError.js';

describe('ClientError', () => {
  it('should throw error when directly use it', () => {
    expect(() => new ClientError('')).toThrow('cannot instantiate abstract class');
  });
});