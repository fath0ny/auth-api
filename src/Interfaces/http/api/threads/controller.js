import AddThreadUseCase from '../../../../Applications/use_case/AddThreadUseCase.js';
import GetThreadDetailUseCase from '../../../../Applications/use_case/GetThreadDetailUseCase.js';
import DomainErrorTranslator from '../../../../Commons/exceptions/DomainErrorTranslator.js';

class ThreadsController {
  constructor(container) {
    this._container = container;
    this.postThread = this.postThread.bind(this);
    this.getThreadDetail = this.getThreadDetail.bind(this);
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

  async getThreadDetail(req, res, next) {
    try {
      const { threadId } = req.params;
      const getThreadDetailUseCase = this._container.getInstance(GetThreadDetailUseCase.name);
      const thread = await getThreadDetailUseCase.execute(threadId);

      res.status(200).json({
        status: 'success',
        data: { thread },
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
