import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import users from '../../Interfaces/http/api/users/index.js';
import authentications from '../../Interfaces/http/api/authentications/index.js';
import threads from '../../Interfaces/http/api/threads/index.js';
import comments from '../../Interfaces/http/api/comments/index.js';
import replies from '../../Interfaces/http/api/replies/index.js';

const createServer = async (container) => {

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Auth API Documentation',
        version: '1.0.0',
        description: 'Dokumentasi API pakai Swagger + Express',
      },
      servers: [
        { url: 'http://localhost:3000' }
      ],
    },
    apis: ['./src/Interfaces/http/api/**/*.js']
  };
  
  const openapiSpecification = swaggerJsDoc(swaggerOptions);

  const app = express();

  app.use(express.json());

  app.use('/users', users(container));
  app.use('/authentications', authentications(container));
  app.use('/threads', threads(container));
  app.use('/threads/:threadId/comments', comments(container));
  app.use('/threads/:threadId/comments/:commentId/replies', replies(container));
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

  app.get('/', (req, res) => {
    res.status(200).json({ data: 'Hello world!' });
  });

  app.use((req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'resource not found',
    });
  });

  return app;
};

export default createServer;
