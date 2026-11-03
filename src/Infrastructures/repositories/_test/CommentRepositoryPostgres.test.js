import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import pool from '../../database/postgres/pool.js';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const newComment = new NewComment({
        content: 'sebuah comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentRepositoryPostgres.addComment(newComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const newComment = new NewComment({
        content: 'sebuah comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'sebuah comment',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyCommentExists function', () => {
    it('should not throw error when comment exists', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123', 'thread-123'))
        .resolves.toBeUndefined();
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(commentRepositoryPostgres.verifyCommentExists('comment-xxx', 'thread-123'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when comment does not belong to the thread', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123', 'thread-456'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when comment has been deleted', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');
      await commentRepositoryPostgres.deleteComment('comment-123');

      // Action and Assert
      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123', 'thread-123'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should not throw error when user is the comment owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-123'))
        .resolves.toBeUndefined();
    });

    it('should throw AuthorizationError when user is not the comment owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-456'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-xxx', 'user-123'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action
      await commentRepositoryPostgres.deleteComment('comment-123');

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments sorted by created_at ascending', async () => {
      // Arrange
      const firstDate = new Date('2021-08-08T07:22:33.555Z');
      const secondDate = new Date('2021-08-08T07:26:21.338Z');
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'johndoe' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'fathony' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        content: 'komentar kedua',
        owner: 'user-456',
        threadId: 'thread-123',
        isDelete: true,
        createdAt: secondDate,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'komentar pertama',
        owner: 'user-123',
        threadId: 'thread-123',
        createdAt: firstDate,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      // Assert
      expect(comments).toStrictEqual([
        {
          id: 'comment-123',
          username: 'johndoe',
          date: firstDate,
          content: 'komentar pertama',
          is_delete: false,
        },
        {
          id: 'comment-456',
          username: 'fathony',
          date: secondDate,
          content: 'komentar kedua',
          is_delete: true,
        },
      ]);
    });

    it('should return empty array when thread has no comment', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      // Assert
      expect(comments).toStrictEqual([]);
    });
  });
});
