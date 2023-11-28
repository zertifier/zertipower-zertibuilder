import {
  ApplicationError,
  ErrorCode,
} from '../../../../../shared/domain/error';

export class SignCodeNotAssignedError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = 'Sign code not assigned') {
    super(message);
  }
}
