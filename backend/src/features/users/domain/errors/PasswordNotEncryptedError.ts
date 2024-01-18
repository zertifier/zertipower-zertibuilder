import { ApplicationError, ErrorCode } from "../../../../shared/domain/error";

export class PasswordNotEncryptedError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;

  constructor(message = "User don't have an encrypted password assigned") {
    super(message);
  }
}
