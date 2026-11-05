class LikeCommentUseCase {
  constructor({ commentLikeRepository, commentRepository, threadRepository }) {
    this._commentLikeRepository = commentLikeRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { threadId, commentId, owner } = useCasePayload;

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExists(commentId, threadId);

    const isLiked = await this._commentLikeRepository.verifyCommentLikeExists(commentId, owner);

    if (isLiked) {
      await this._commentLikeRepository.deleteCommentLike(commentId, owner);
    } else {
      await this._commentLikeRepository.addCommentLike(commentId, owner);
    }
  }
}

export default LikeCommentUseCase;