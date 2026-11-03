import express from 'express';
import authenticate from '../../../../Infrastructures/http/middlewares/authenticate.js';

const routes = (controller) => {
  // mergeParams: true agar router ini bisa membaca req.params.threadId
  // yang ditangkap dari path mount '/threads/:threadId/comments'.
  const router = express.Router({ mergeParams: true });

  router.post('/', authenticate, controller.postComment);
  router.delete('/:commentId', authenticate, controller.deleteComment);

  return router;
};

export default routes;
