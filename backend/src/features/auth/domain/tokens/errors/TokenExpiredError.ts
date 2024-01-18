import {
  ApplicationError,
  ErrorCode,
} from "../../../../../shared/domain/error";

export class TokenExpiredError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.UNAUTHORIZED;

  constructor(message = "Token expired") {
    super(message);
  }
}
