import {
  ApplicationError,
  ErrorCode,
} from "../../../../../shared/domain/error";

export class TokenRevokedError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.UNAUTHORIZED;

  constructor(message = "Token revoked") {
    super(message);
  }
}
