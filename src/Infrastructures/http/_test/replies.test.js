import request from 'supertest';
import jwt from 'jsonwebtoken';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';

describe('/threads/{threadId}/comments/{commentId}/replies endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  const getAccessToken = async ({ id = 'user-123', username = 'fathony' } = {}) => {
    await UsersTableTestHelper.addUser({ id, username });
    return jwt.sign({ id, username }, process.env.ACCESS_TOKEN_KEY);
  };

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 and persisted reply', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah balasan',
      };
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply).toBeDefined();
      expect(response.body.data.addedReply.content).toEqual(requestPayload.content);
      expect(response.body.data.addedReply.owner).toEqual('user-123');

      const replies = await RepliesTableTestHelper.findRepliesById(
        response.body.data.addedReply.id,
      );
      expect(replies).toHaveLength(1);
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 123 });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when thread does not exist', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-xxx/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when comment does not exist', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments/comment-xxx/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when comment does not belong to the thread', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-456/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 401 when request does not contain access token', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments/comment-123/replies')
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should response 200 and soft delete reply', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({ status: 'success' });

      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });

    it('should response 403 when user is not the reply owner', async () => {
      // Arrange
      const ownerAccessToken = await getAccessToken({ id: 'user-456', username: 'owner' });
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-456' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-456',
        threadId: 'thread-123',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-456',
        commentId: 'comment-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(ownerAccessToken).toBeDefined();
      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when thread does not exist', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-xxx/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when comment does not exist', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-xxx/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when reply does not exist', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-xxx')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when reply does not belong to the comment', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-456/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 401 when request does not contain access token', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });
});
