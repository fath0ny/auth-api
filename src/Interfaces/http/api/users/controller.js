import AddUserUseCase from '../../../../Applications/use_case/AddUserUseCase.js';
import DomainErrorTranslator from '../../../../Commons/exceptions/DomainErrorTranslator.js';
 
class UsersController {
  constructor(container) {
    this._container = container;
    this.postUser = this.postUser.bind(this);
  }
 
  async postUser(req, res, next) {
    try {
      const addUserUseCase = this._container.getInstance(AddUserUseCase.name);
      const addedUser = await addUserUseCase.execute(req.body);
 
      res.status(201).json({
        status: 'success',
        data: { addedUser },
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
 
export default UsersController;