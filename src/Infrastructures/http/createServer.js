import express from 'express';
import users from '../../Interfaces/http/api/users/index.js';
 
const createServer = async (container) => {
 
  const app = express();
 
  app.use(express.json());
 
  app.use('/users', users(container));
 
  app.use((req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'resource not found',
    });
  });
 
  return app;
};
 
export default createServer;