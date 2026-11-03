/* istanbul ignore file */

import pool from '../src/Infrastructures/database/postgres/pool.js';

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123',
    content = 'sebuah comment',
    owner = 'user-123',
    threadId = 'thread-123',
    isDelete = false,
    createdAt = new Date(),
  }) {
    const query = {
      text: 'INSERT INTO comments (id, content, owner, thread_id, is_delete, created_at) VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, owner, threadId, isDelete, createdAt],
    };

    await pool.query(query);
  },

  async findCommentsById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('TRUNCATE TABLE comments CASCADE');
  },
};

export default CommentsTableTestHelper;
