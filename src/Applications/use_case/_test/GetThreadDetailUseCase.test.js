import { vi, describe, expect, it } from 'vitest';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const threadDate = new Date('2021-08-08T07:19:09.775Z');
    const firstCommentDate = new Date('2021-08-08T07:22:33.555Z');
    const secondCommentDate = new Date('2021-08-08T07:26:21.338Z');
    const firstReplyDate = new Date('2021-08-08T07:59:48.766Z');
    const secondReplyDate = new Date('2021-08-08T08:07:01.522Z');
    const mockThread = {
      id: threadId,
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: threadDate,
      username: 'fathony',
    };
    const mockComments = [
      {
        id: 'comment-123',
        username: 'johndoe',
        date: firstCommentDate,
        content: 'sebuah comment',
        is_delete: false,
      },
      {
        id: 'comment-456',
        username: 'fathony',
        date: secondCommentDate,
        content: 'komentar yang dihapus',
        is_delete: true,
      },
    ];
    const mockReplies = [
      {
        id: 'reply-123',
        comment_id: 'comment-123',
        username: 'johndoe',
        date: firstReplyDate,
        content: 'balasan yang dihapus',
        is_delete: true,
      },
      {
        id: 'reply-456',
        comment_id: 'comment-123',
        username: 'fathony',
        date: secondReplyDate,
        content: 'sebuah balasan',
        is_delete: false,
      },
    ];

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve(mockComments));
    mockReplyRepository.getRepliesByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve(mockReplies));

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByThreadId).toBeCalledWith(threadId);
    expect(thread).toStrictEqual({
      ...mockThread,
      comments: [
        {
          id: 'comment-123',
          username: 'johndoe',
          date: firstCommentDate,
          content: 'sebuah comment',
          replies: [
            {
              id: 'reply-123',
              content: '**balasan telah dihapus**',
              date: firstReplyDate,
              username: 'johndoe',
            },
            {
              id: 'reply-456',
              content: 'sebuah balasan',
              date: secondReplyDate,
              username: 'fathony',
            },
          ],
        },
        {
          id: 'comment-456',
          username: 'fathony',
          date: secondCommentDate,
          content: '**komentar telah dihapus**',
          replies: [],
        },
      ],
    });
  });

  it('should not get comments and replies when thread is not found', async () => {
    // Arrange
    const threadId = 'thread-xxx';

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));
    mockCommentRepository.getCommentsByThreadId = vi.fn();
    mockReplyRepository.getRepliesByThreadId = vi.fn();

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action and Assert
    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).not.toBeCalled();
    expect(mockReplyRepository.getRepliesByThreadId).not.toBeCalled();
  });
});
