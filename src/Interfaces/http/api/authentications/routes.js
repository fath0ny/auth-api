import express from 'express';

const routes = (controller) => {
  const router = express.Router();

  router.post('/', controller.postAuthentication);
  router.put('/', controller.putAuthentication);
  router.delete('/', controller.deleteAuthentication);

  return router;
};

export default routes;
