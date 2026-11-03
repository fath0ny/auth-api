import { vi, describe, expect, it } from 'vitest';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const threadDate = new Date('2021-08-08T07:19:09.775Z');
    const firstCommentDate = new Date('2021-08-08T07:22:33.555Z');
    const secondCommentDate = new Date('2021-08-08T07:26:21.338Z');
    const mockThread = {
      id: threadId,
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: threadDate,
      username: 'dicoding',
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
        username: 'dicoding',
        date: secondCommentDate,
        content: 'komentar yang dihapus',
        is_delete: true,
      },
    ];

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve(mockComments));

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(thread).toStrictEqual({
      ...mockThread,
      comments: [
        {
          id: 'comment-123',
          username: 'johndoe',
          date: firstCommentDate,
          content: 'sebuah comment',
        },
        {
          id: 'comment-456',
          username: 'dicoding',
          date: secondCommentDate,
          content: '**komentar telah dihapus**',
        },
      ],
    });
  });
});
