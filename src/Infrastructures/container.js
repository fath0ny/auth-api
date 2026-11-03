/* istanbul ignore file */

import { createContainer } from 'instances-container';

// external agency 
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import pool from './database/postgres/pool.js';
 
// service (repository, helper, manager, etc)
import UserRepository from '../Domains/users/UserRepository.js';
import UserRepositoryPostgres from './repositories/UserRepositoryPostgres.js';
import BcryptPasswordHash from './security/BcryptPasswordHash.js';
import ThreadRepository from '../Domains/threads/ThreadRepository.js';
import ThreadRepositoryPostgres from './repositories/ThreadRepositoryPostgres.js';
import CommentRepository from '../Domains/comments/CommentRepository.js';
import CommentRepositoryPostgres from './repositories/CommentRepositoryPostgres.js';
 
// use case
import AddUserUseCase from '../Applications/use_case/AddUserUseCase.js';
import PasswordHash from '../Applications/security/PasswordHash.js';
import AddThreadUseCase from '../Applications/use_case/AddThreadUseCase.js';
import AddCommentUseCase from '../Applications/use_case/AddCommentUseCase.js';
 
// creating container
const container = createContainer();
 
// registering services and repository
container.register([
  {
    key: UserRepository.name,
    Class: UserRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid,
        },
      ],
    },
  },
  {
    key: PasswordHash.name,
    Class: BcryptPasswordHash,
    parameter: {
      dependencies: [
        {
          concrete: bcrypt,
        },
      ],
    },
  },
  {
    key: ThreadRepository.name,
    Class: ThreadRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid,
        },
      ],
    },
  },
  {
    key: CommentRepository.name,
    Class: CommentRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid,
        },
      ],
    },
  },
]);
 
// registering use cases
container.register([
  {
    key: AddUserUseCase.name,
    Class: AddUserUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'userRepository',
          internal: UserRepository.name,
        },
        {
          name: 'passwordHash',
          internal: PasswordHash.name,
        },
      ],
    },
  },
  {
    key: AddThreadUseCase.name,
    Class: AddThreadUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'threadRepository',
          internal: ThreadRepository.name,
        },
      ],
    },
  },
  {
    key: AddCommentUseCase.name,
    Class: AddCommentUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'commentRepository',
          internal: CommentRepository.name,
        },
        {
          name: 'threadRepository',
          internal: ThreadRepository.name,
        },
      ],
    },
  },
]);
 
export default container;
