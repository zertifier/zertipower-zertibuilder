import {
  ApplicationError,
  ErrorCode,
} from "../../../../../shared/domain/error";

export class TokenNotGivenError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = "Token not given") {
    super(message);
  }
}
