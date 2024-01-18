import {
  ApplicationError,
  ErrorCode,
} from "../../../../../shared/domain/error";

export class MissingCredentialsError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.UNAUTHORIZED;

  constructor(message = "Missing credentials") {
    super(message);
  }
}
