import { ApplicationError, ErrorCode } from '../../../../shared/domain/error';

export class ResetPasswordCodeNotValidError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = 'Reset password code not valid') {
    super(message);
  }
}
