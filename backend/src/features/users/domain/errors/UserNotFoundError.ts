import { ApplicationError, ErrorCode } from '../../../../shared/domain/error';

export class UserNotFoundError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = 'User not found') {
    super(message);
  }
}
