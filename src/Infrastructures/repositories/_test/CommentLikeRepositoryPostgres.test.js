import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import CommentLikeRepositoryPostgres from '../CommentLikeRepositoryPostgres.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';

describe('CommentLikeRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('verifyCommentLikeExists function', () => {
    it('should return true when comment has been liked by the user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await CommentLikesTableTestHelper.addCommentLike({
        id: 'like-123', commentId: 'comment-123', owner: 'user-123',
      });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      // Action
      const isLiked = await commentLikeRepositoryPostgres
        .verifyCommentLikeExists('comment-123', 'user-123');

      // Assert
      expect(isLiked).toEqual(true);
    });

    it('should return false when comment has not been liked by the user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      // Action
      const isLiked = await commentLikeRepositoryPostgres
        .verifyCommentLikeExists('comment-123', 'user-123');

      // Assert
      expect(isLiked).toEqual(false);
    });
  });

  describe('addCommentLike function', () => {
    it('should persist new comment like', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      // Action
      await commentLikeRepositoryPostgres.addCommentLike('comment-123', 'user-123');

      // Assert
      const likes = await CommentLikesTableTestHelper
        .findCommentLikesByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(1);
    });
  });

  describe('deleteCommentLike function', () => {
    it('should remove comment like', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await CommentLikesTableTestHelper.addCommentLike({
        id: 'like-123', commentId: 'comment-123', owner: 'user-123',
      });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      // Action
      await commentLikeRepositoryPostgres.deleteCommentLike('comment-123', 'user-123');

      // Assert
      const likes = await CommentLikesTableTestHelper
        .findCommentLikesByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(0);
    });
  });

  describe('getLikeCountsByThreadId function', () => {
    it('should return like count grouped by comment id', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'johndoe' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'fathony' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123', threadId: 'thread-123', owner: 'user-123',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', threadId: 'thread-123', owner: 'user-123',
      });
      await CommentLikesTableTestHelper.addCommentLike({
        id: 'like-123', commentId: 'comment-123', owner: 'user-123',
      });
      await CommentLikesTableTestHelper.addCommentLike({
        id: 'like-456', commentId: 'comment-123', owner: 'user-456',
      });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      // Action
      const likeCounts = await commentLikeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      // Assert
      expect(likeCounts).toStrictEqual([
        { comment_id: 'comment-123', like_count: 2 },
      ]);
    });

    it('should return empty array when no comment has been liked', async () => {
      // Arrange
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      // Action
      const likeCounts = await commentLikeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      // Assert
      expect(likeCounts).toStrictEqual([]);
    });
  });
});