import { ApplicationError, ErrorCode } from '../../../../shared/domain/error';

export class PasswordNotMatchError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.UNAUTHORIZED;

  constructor(message = "Password don't match") {
    super(message);
  }
}
