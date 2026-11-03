const DELETED_COMMENT_CONTENT = '**komentar telah dihapus**';

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    return {
      ...thread,
      comments: comments.map((comment) => ({
        id: comment.id,
        username: comment.username,
        date: comment.date,
        content: comment.is_delete ? DELETED_COMMENT_CONTENT : comment.content,
      })),
    };
  }
}

export default GetThreadDetailUseCase;
