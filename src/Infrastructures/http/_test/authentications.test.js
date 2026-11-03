import request from 'supertest';
import { describe, expect, it, afterEach, afterAll } from 'vitest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';

describe('/authentications endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  const registerUser = async (server, username = 'fathony') => request(server)
    .post('/users')
    .send({
      username,
      password: 'secret',
      fullname: 'Mamang Racing',
    });

  const login = async (server, username = 'fathony', password = 'secret') => request(server)
    .post('/authentications')
    .send({ username, password });

  describe('when POST /authentications', () => {
    it('should response 201 and return access and refresh token', async () => {
      // Arrange
      const server = await createServer(container);
      await registerUser(server);

      // Action
      const response = await login(server);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeTypeOf('string');
      expect(response.body.data.refreshToken).toBeTypeOf('string');
    });

    it('should response 400 when username not registered', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await login(server, 'unknown', 'secret');

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak terdaftar');
    });

    it('should response 401 when password is wrong', async () => {
      // Arrange
      const server = await createServer(container);
      await registerUser(server);

      // Action
      const response = await login(server, 'fathony', 'wrong_password');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('kredensial yang Anda berikan salah');
    });
  });

  describe('when PUT /authentications', () => {
    it('should response 200 and return new access token', async () => {
      // Arrange
      const server = await createServer(container);
      await registerUser(server);
      const loginResponse = await login(server);

      // Action
      const response = await request(server)
        .put('/authentications')
        .send({ refreshToken: loginResponse.body.data.refreshToken });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeTypeOf('string');
    });

    it('should response 400 when refresh token is invalid', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .put('/authentications')
        .send({ refreshToken: 'xxx' });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak valid');
    });
  });

  describe('when DELETE /authentications', () => {
    it('should response 200 and delete refresh token', async () => {
      // Arrange
      const server = await createServer(container);
      await registerUser(server);
      const loginResponse = await login(server);
      const { refreshToken } = loginResponse.body.data;

      // Action
      const response = await request(server)
        .delete('/authentications')
        .send({ refreshToken });

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      await expect(AuthenticationsTableTestHelper.findToken(refreshToken))
        .resolves.toHaveLength(0);
    });

    it('should response 400 when refresh token not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/authentications')
        .send({ refreshToken: 'xxx' });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });
  });
});
