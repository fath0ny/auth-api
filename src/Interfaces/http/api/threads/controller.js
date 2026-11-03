import AddThreadUseCase from '../../../../Applications/use_case/AddThreadUseCase.js';
import DomainErrorTranslator from '../../../../Commons/exceptions/DomainErrorTranslator.js';

class ThreadsController {
  constructor(container) {
    this._container = container;
    this.postThread = this.postThread.bind(this);
  }

  async postThread(req, res, next) {
    try {
      const { id: owner } = req.user;
      const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
      const addedThread = await addThreadUseCase.execute({ ...req.body, owner });

      res.status(201).json({
        status: 'success',
        data: { addedThread },
      });
    } catch (error) {
      const translated = DomainErrorTranslator.translate(error);
      return res.status(translated.statusCode).json({
        status: 'fail',
        message: translated.message,
      });
    }
  }
}

export default ThreadsController;
