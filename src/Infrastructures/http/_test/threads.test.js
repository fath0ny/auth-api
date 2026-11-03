import request from 'supertest';
import jwt from 'jsonwebtoken';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';

describe('/threads endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  const getAccessToken = async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    return jwt.sign({ id: 'user-123', username: 'dicoding' }, process.env.ACCESS_TOKEN_KEY);
  };

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };
      const accessToken = await getAccessToken();
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread).toBeDefined();
      expect(response.body.data.addedThread.title).toEqual(requestPayload.title);
      expect(response.body.data.addedThread.owner).toEqual('user-123');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
      };
      const accessToken = await getAccessToken();
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 401 when request does not contain access token', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads')
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 200 and return thread detail with comments', async () => {
      // Arrange
      const threadDate = new Date('2021-08-08T07:19:09.775Z');
      const firstCommentDate = new Date('2021-08-08T07:22:33.555Z');
      const secondCommentDate = new Date('2021-08-08T07:26:21.338Z');
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
        createdAt: threadDate,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        content: 'komentar yang dihapus',
        owner: 'user-123',
        threadId: 'thread-123',
        isDelete: true,
        createdAt: secondCommentDate,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'sebuah comment',
        owner: 'user-456',
        threadId: 'thread-123',
        createdAt: firstCommentDate,
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .get('/threads/thread-123');

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        status: 'success',
        data: {
          thread: {
            id: 'thread-123',
            title: 'sebuah thread',
            body: 'sebuah body thread',
            date: threadDate.toISOString(),
            username: 'dicoding',
            comments: [
              {
                id: 'comment-123',
                username: 'johndoe',
                date: firstCommentDate.toISOString(),
                content: 'sebuah comment',
              },
              {
                id: 'comment-456',
                username: 'dicoding',
                date: secondCommentDate.toISOString(),
                content: '**komentar telah dihapus**',
              },
            ],
          },
        },
      });
    });

    it('should response 200 and return empty comments when thread has no comment', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .get('/threads/thread-123');

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread.comments).toStrictEqual([]);
    });

    it('should response 404 when thread does not exist', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .get('/threads/thread-xxx');

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });
  });
});
