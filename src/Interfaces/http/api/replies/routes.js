import express from 'express';
import authenticate from '../../../../Infrastructures/http/middlewares/authenticate.js';

const routes = (controller) => {
  // mergeParams: true agar router ini bisa membaca req.params.threadId dan
  // req.params.commentId dari path mount
  // '/threads/:threadId/comments/:commentId/replies'.
  const router = express.Router({ mergeParams: true });

  router.post('/', authenticate, controller.postReply);

  return router;
};

export default routes;
