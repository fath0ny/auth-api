import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import NewReply from '../../../Domains/replies/entities/NewReply.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import pool from '../../database/postgres/pool.js';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres.js';
import { describe, expect, it, afterEach, afterAll } from 'vitest';

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const newReply = new NewReply({
        content: 'sebuah balasan',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await replyRepositoryPostgres.addReply(newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
    });

    it('should return added reply correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const newReply = new NewReply({
        content: 'sebuah balasan',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-123',
      }));
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return replies from the thread sorted by created_at ascending', async () => {
      // Arrange
      const firstDate = new Date('2021-08-08T07:59:48.766Z');
      const secondDate = new Date('2021-08-08T08:07:01.522Z');
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'fathony' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-456' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-456',
        content: 'balasan kedua',
        owner: 'user-123',
        commentId: 'comment-123',
        createdAt: secondDate,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        content: 'balasan pertama',
        owner: 'user-456',
        commentId: 'comment-123',
        isDelete: true,
        createdAt: firstDate,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-789',
        content: 'balasan thread lain',
        owner: 'user-123',
        commentId: 'comment-456',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toStrictEqual([
        {
          id: 'reply-123',
          comment_id: 'comment-123',
          content: 'balasan pertama',
          is_delete: true,
          date: firstDate,
          username: 'johndoe',
        },
        {
          id: 'reply-456',
          comment_id: 'comment-123',
          content: 'balasan kedua',
          is_delete: false,
          date: secondDate,
          username: 'fathony',
        },
      ]);
    });

    it('should return empty array when thread has no reply', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toStrictEqual([]);
    });
  });

  describe('verifyReplyExists function', () => {
    it('should not throw error when reply exists', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123', 'comment-123'))
        .resolves.toBeUndefined();
    });

    it('should throw NotFoundError when reply does not exist', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-xxx', 'comment-123'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when reply does not belong to the comment', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123', 'comment-456'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when reply has been deleted', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');
      await replyRepositoryPostgres.deleteReply('reply-123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123', 'comment-123'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should not throw error when user is the reply owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123'))
        .resolves.toBeUndefined();
    });

    it('should throw AuthorizationError when user is not the reply owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-456'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should throw NotFoundError when reply does not exist', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-xxx', 'user-123'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteReply function', () => {
    it('should soft delete reply', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action
      await replyRepositoryPostgres.deleteReply('reply-123');

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });
  });
});
