import { vi, describe, expect, it } from 'vitest';
import CommentLikeRepository from '../../../Domains/comment_likes/CommentLikeRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import LikeCommentUseCase from '../LikeCommentUseCase.js';

describe('LikeCommentUseCase', () => {
  it('should orchestrating the like comment action correctly when comment has not been liked', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentLikeRepository.verifyCommentLikeExists = vi.fn()
      .mockImplementation(() => Promise.resolve(false));
    mockCommentLikeRepository.addCommentLike = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentLikeRepository.deleteCommentLike = vi.fn();

    const likeCommentUseCase = new LikeCommentUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await likeCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.threadId,
    );
    expect(mockCommentLikeRepository.verifyCommentLikeExists).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.owner,
    );
    expect(mockCommentLikeRepository.addCommentLike).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.owner,
    );
    expect(mockCommentLikeRepository.deleteCommentLike).not.toBeCalled();
  });

  it('should orchestrating the unlike comment action correctly when comment has been liked', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentLikeRepository.verifyCommentLikeExists = vi.fn()
      .mockImplementation(() => Promise.resolve(true));
    mockCommentLikeRepository.deleteCommentLike = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentLikeRepository.addCommentLike = vi.fn();

    const likeCommentUseCase = new LikeCommentUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await likeCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockCommentLikeRepository.verifyCommentLikeExists).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.owner,
    );
    expect(mockCommentLikeRepository.deleteCommentLike).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.owner,
    );
    expect(mockCommentLikeRepository.addCommentLike).not.toBeCalled();
  });

  it('should not like comment when thread is not found', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-xxx',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));
    mockCommentRepository.verifyCommentExists = vi.fn();
    mockCommentLikeRepository.verifyCommentLikeExists = vi.fn();
    mockCommentLikeRepository.addCommentLike = vi.fn();
    mockCommentLikeRepository.deleteCommentLike = vi.fn();

    const likeCommentUseCase = new LikeCommentUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action and Assert
    await expect(likeCommentUseCase.execute(useCasePayload))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists).not.toBeCalled();
    expect(mockCommentLikeRepository.verifyCommentLikeExists).not.toBeCalled();
  });

  it('should not like comment when comment is not found', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-xxx',
      owner: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('komentar tidak ditemukan')));
    mockCommentLikeRepository.verifyCommentLikeExists = vi.fn();
    mockCommentLikeRepository.addCommentLike = vi.fn();
    mockCommentLikeRepository.deleteCommentLike = vi.fn();

    const likeCommentUseCase = new LikeCommentUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action and Assert
    await expect(likeCommentUseCase.execute(useCasePayload))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.threadId,
    );
    expect(mockCommentLikeRepository.verifyCommentLikeExists).not.toBeCalled();
  });
});