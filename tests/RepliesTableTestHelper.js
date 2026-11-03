/* istanbul ignore file */

import pool from '../src/Infrastructures/database/postgres/pool.js';

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    content = 'sebuah balasan',
    owner = 'user-123',
    commentId = 'comment-123',
    isDelete = false,
    createdAt = new Date(),
  }) {
    const query = {
      text: 'INSERT INTO replies (id, content, owner, comment_id, is_delete, created_at) VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, owner, commentId, isDelete, createdAt],
    };

    await pool.query(query);
  },

  async findRepliesById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('TRUNCATE TABLE replies CASCADE');
  },
};

export default RepliesTableTestHelper;
