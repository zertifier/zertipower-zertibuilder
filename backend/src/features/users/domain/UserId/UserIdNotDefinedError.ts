import { ApplicationError, ErrorCode } from '../../../../shared/domain/error';

export class UserIdNotDefinedError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;

  constructor(message = 'User id not defined') {
    super(message);
  }
}
