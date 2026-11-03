import express from 'express';
import authenticate from '../../../../Infrastructures/http/middlewares/authenticate.js';

const routes = (controller) => {
  const router = express.Router();

  router.post('/', authenticate, controller.postThread);

  return router;
};

export default routes;
