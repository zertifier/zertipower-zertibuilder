import { ApplicationError, ErrorCode } from "../../../../shared/domain/error";

export class UserAlreadyExistsError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = "User already exist") {
    super(message);
  }
}
