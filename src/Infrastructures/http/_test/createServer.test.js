import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';
 
describe('HTTP server', () => {
  afterAll(async () => {
    await pool.end();
  });
 
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });
 
  describe('when POST /users', () => {
    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        username: 'fathony',
        password: 'secret',
        fullname: 'Mamang Racing',
      };
      const server = await createServer(container);
 
      // Action
      const response = await request(server).post('/users').send(requestPayload);
 
      // Assert
      expect(response.status).toEqual(201);      
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedUser).toBeDefined();
    });
  });
});