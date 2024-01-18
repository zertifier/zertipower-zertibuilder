import {
  ApplicationError,
  ErrorCode,
} from "../../../../../shared/domain/error";

export class TokenNotValidError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.FORBIDDEN;

  constructor(message = "Token not valid") {
    super(message);
  }
}
