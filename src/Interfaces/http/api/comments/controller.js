import AddCommentUseCase from '../../../../Applications/use_case/AddCommentUseCase.js';
import DeleteCommentUseCase from '../../../../Applications/use_case/DeleteCommentUseCase.js';
import LikeCommentUseCase from '../../../../Applications/use_case/LikeCommentUseCase.js';
import DomainErrorTranslator from '../../../../Commons/exceptions/DomainErrorTranslator.js';

class CommentsController {
  constructor(container) {
    this._container = container;
    this.postComment = this.postComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.putCommentLike = this.putCommentLike.bind(this);
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

  async deleteComment(req, res, next) {
    try {
      const { id: owner } = req.user;
      const { threadId, commentId } = req.params;
      const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
      await deleteCommentUseCase.execute({ threadId, commentId, owner });

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

  async putCommentLike(req, res, next) {
    try {
      const { id: owner } = req.user;
      const { threadId, commentId } = req.params;
      const likeCommentUseCase = this._container.getInstance(LikeCommentUseCase.name);
      await likeCommentUseCase.execute({ threadId, commentId, owner });

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

export default CommentsController;