class CommentLikeRepository {
  async verifyCommentLikeExists(commentId, owner) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
 
  async addCommentLike(commentId, owner) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
 
  async deleteCommentLike(commentId, owner) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
 
  async getLikeCountsByThreadId(threadId) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
}
 
export default CommentLikeRepository;