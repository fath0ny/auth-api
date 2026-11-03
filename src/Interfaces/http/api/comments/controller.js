import AddCommentUseCase from '../../../../Applications/use_case/AddCommentUseCase.js';
import DomainErrorTranslator from '../../../../Commons/exceptions/DomainErrorTranslator.js';

class CommentsController {
  constructor(container) {
    this._container = container;
    this.postComment = this.postComment.bind(this);
  }

  async postComment(req, res, next) {
    try {
      const { id: owner } = req.user;
      const { threadId } = req.params;
      const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
      const addedComment = await addCommentUseCase.execute({ ...req.body, owner, threadId });

      res.status(201).json({
        status: 'success',
        data: { addedComment },
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

export default CommentsController;
