import AddReplyUseCase from '../../../../Applications/use_case/AddReplyUseCase.js';
import DeleteReplyUseCase from '../../../../Applications/use_case/DeleteReplyUseCase.js';
import DomainErrorTranslator from '../../../../Commons/exceptions/DomainErrorTranslator.js';

class RepliesController {
  constructor(container) {
    this._container = container;
    this.postReply = this.postReply.bind(this);
    this.deleteReply = this.deleteReply.bind(this);
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

  async deleteReply(req, res, next) {
    try {
      const { id: owner } = req.user;
      const { threadId, commentId, replyId } = req.params;
      const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);
      await deleteReplyUseCase.execute({ threadId, commentId, replyId, owner });

      res.status(200).json({
        status: 'success',
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
