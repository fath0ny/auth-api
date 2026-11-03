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
  
  describe('when GET /', () => {
    it('should return 200 and hello world', async () => {
      // Arrange
      const app = await createServer({});

      // Action
      const response = await request(app).get('/');

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.data).toEqual('Hello world!');
    });
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
 
    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {
        fullname: 'Mamang Racing',
        password: 'secret',
      };
      const server = await createServer(container);
      // Action
      const response = await request(server).post('/users').send(requestPayload);
      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada');
    });
    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const requestPayload = {
        username: 'fathony',
        password: 'secret',
        fullname: ['Mamang Racing'],
      };
      const server = await createServer(container);
      // Action
      const response = await request(server).post('/users').send(requestPayload);
      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena tipe data tidak sesuai');
    });
    it('should response 400 when username more than 50 character', async () => {
      // Arrange
      const requestPayload = {
        username: 'fathonyindonesiafathonyindonesiafathonyindonesiafathony',
        password: 'secret',
        fullname: 'Mamang Racing',
      };
      const server = await createServer(container);
      // Action
      const response = await request(server).post('/users').send(requestPayload);
      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena karakter username melebihi batas limit');
    });
    it('should response 400 when username contain restricted character', async () => {
      // Arrange
      const requestPayload = {
        username: 'fathony ss',
        password: 'secret',
        fullname: 'Mamang Racing',
      };
      const server = await createServer(container);
      // Action
      const response = await request(server).post('/users').send(requestPayload);
      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena username mengandung karakter terlarang');
    });
    it('should response 400 when username unavailable', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fathony' });
      const requestPayload = {
        username: 'fathony',
        fullname: 'Mamang Racing',
        password: 'super_secret',
      };
      const server = await createServer(container);
      // Action
      const response = await request(server)
       .post('/users')
       .send(requestPayload);
      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak tersedia');
    });
  });

  describe('when accessing unknown route', () => {
    it('should response 404 with fail status', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await request(server).get('/unknown-route');

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'resource not found',
      });
    });
  });
});