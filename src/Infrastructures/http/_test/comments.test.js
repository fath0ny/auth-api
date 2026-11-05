import request from 'supertest';
import jwt from 'jsonwebtoken';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';

describe('/threads/{threadId}/comments endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  const getAccessToken = async ({ id = 'user-123', username = 'fathony' } = {}) => {
    await UsersTableTestHelper.addUser({ id, username });
    return jwt.sign({ id, username }, process.env.ACCESS_TOKEN_KEY);
  };

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and persisted comment', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah comment',
      };
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment).toBeDefined();
      expect(response.body.data.addedComment.content).toEqual(requestPayload.content);
      expect(response.body.data.addedComment.owner).toEqual('user-123');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {};
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 404 when thread does not exist', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah comment',
      };
      const accessToken = await getAccessToken();
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-xxx/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 401 when request does not contain access token', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah comment',
      };
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .post('/threads/thread-123/comments')
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200 and soft delete comment', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({ status: 'success' });

      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });

    it('should response 403 when user is not the comment owner', async () => {
      // Arrange
      const ownerAccessToken = await getAccessToken({ id: 'user-456', username: 'owner' });
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-456' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-456',
        threadId: 'thread-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-123')
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
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-xxx/comments/comment-123')
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
        .delete('/threads/thread-123/comments/comment-xxx')
        .set('Authorization', `Bearer ${accessToken}`);

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
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .delete('/threads/thread-456/comments/comment-123')
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
        .delete('/threads/thread-123/comments/comment-123');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and like the comment when not liked yet', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({ status: 'success' });

      const likes = await CommentLikesTableTestHelper
        .findCommentLikesByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(1);
    });

    it('should response 200 and unlike the comment when already liked', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      await CommentLikesTableTestHelper.addCommentLike({
        id: 'like-123',
        commentId: 'comment-123',
        owner: 'user-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({ status: 'success' });

      const likes = await CommentLikesTableTestHelper
        .findCommentLikesByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(0);
    });

    it('should response 404 when thread does not exist', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .put('/threads/thread-xxx/comments/comment-123/likes')
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
        .put('/threads/thread-123/comments/comment-xxx/likes')
        .set('Authorization', `Bearer ${accessToken}`);

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
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const server = await createServer(container);

      // Action
      const response = await request(server)
        .put('/threads/thread-456/comments/comment-123/likes')
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
        .put('/threads/thread-123/comments/comment-123/likes');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });
});