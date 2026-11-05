/* istanbul ignore file */

import pool from '../src/Infrastructures/database/postgres/pool.js';

const CommentLikesTableTestHelper = {
  async addCommentLike({
    id = 'like-123',
    commentId = 'comment-123',
    owner = 'user-123',
  }) {
    const query = {
      text: 'INSERT INTO comment_likes (id, comment_id, owner) VALUES($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await pool.query(query);
  },

  async findCommentLikesByCommentIdAndOwner(commentId, owner) {
    const query = {
      text: 'SELECT * FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('TRUNCATE TABLE comment_likes CASCADE');
  },
};

export default CommentLikesTableTestHelper;