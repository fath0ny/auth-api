const DELETED_COMMENT_CONTENT = '**komentar telah dihapus**';
const DELETED_REPLY_CONTENT = '**balasan telah dihapus**';

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);

    const repliesByCommentId = replies.reduce((grouped, reply) => {
      if (!grouped[reply.comment_id]) {
        grouped[reply.comment_id] = [];
      }

      grouped[reply.comment_id].push({
        id: reply.id,
        content: reply.is_delete ? DELETED_REPLY_CONTENT : reply.content,
        date: reply.date,
        username: reply.username,
      });

      return grouped;
    }, {});

    return {
      ...thread,
      comments: comments.map((comment) => ({
        id: comment.id,
        username: comment.username,
        date: comment.date,
        content: comment.is_delete ? DELETED_COMMENT_CONTENT : comment.content,
        replies: repliesByCommentId[comment.id] || [],
      })),
    };
  }
}

export default GetThreadDetailUseCase;
