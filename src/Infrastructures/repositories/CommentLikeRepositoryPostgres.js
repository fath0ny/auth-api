import CommentLikeRepository from '../../Domains/comment_likes/CommentLikeRepository.js';

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async verifyCommentLikeExists(commentId, owner) {
    const query = {
      text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0;
  }

  async addCommentLike(commentId, owner) {
    const id = `like-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO comment_likes (id, comment_id, owner) VALUES($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await this._pool.query(query);
  }

  async deleteCommentLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async getLikeCountsByThreadId(threadId) {
    const query = {
      text: `SELECT comment_likes.comment_id, COUNT(comment_likes.id)::int AS like_count
             FROM comment_likes
             JOIN comments ON comments.id = comment_likes.comment_id
             WHERE comments.thread_id = $1
             GROUP BY comment_likes.comment_id`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

export default CommentLikeRepositoryPostgres;