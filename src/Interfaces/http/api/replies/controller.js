import AddReplyUseCase from '../../../../Applications/use_case/AddReplyUseCase.js';
import DomainErrorTranslator from '../../../../Commons/exceptions/DomainErrorTranslator.js';

class RepliesController {
  constructor(container) {
    this._container = container;
    this.postReply = this.postReply.bind(this);
  }

  async postReply(req, res, next) {
    try {
      const { id: owner } = req.user;
      const { threadId, commentId } = req.params;
      const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name);
      const addedReply = await addReplyUseCase.execute({
        ...req.body,
        owner,
        threadId,
        commentId,
      });

      res.status(201).json({
        status: 'success',
        data: { addedReply },
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

export default RepliesController;
