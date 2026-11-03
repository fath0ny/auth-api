import express from 'express';
import users from '../../Interfaces/http/api/users/index.js';
import threads from '../../Interfaces/http/api/threads/index.js';
import comments from '../../Interfaces/http/api/comments/index.js';

const createServer = async (container) => {

  const app = express();

  app.use(express.json());

  app.use('/users', users(container));
  app.use('/threads', threads(container));
  app.use('/threads/:threadId/comments', comments(container));

  app.use((req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'resource not found',
    });
  });

  return app;
};

export default createServer;
