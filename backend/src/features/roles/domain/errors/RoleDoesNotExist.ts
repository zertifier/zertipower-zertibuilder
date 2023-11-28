import { ApplicationError, ErrorCode } from '../../../../shared/domain/error';

export class UserRoleDoesNotExistError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = 'Role does not exist') {
    super(message);
  }
}
