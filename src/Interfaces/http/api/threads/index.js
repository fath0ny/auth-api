import routes from './routes.js';
import ThreadsController from './controller.js';

const threads = (container) => {
  const threadsController = new ThreadsController(container);

  return routes(threadsController);
};

export default threads;
