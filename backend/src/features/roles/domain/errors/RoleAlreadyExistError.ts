import { ApplicationError, ErrorCode } from "../../../../shared/domain/error";

export class RoleAlreadyExistError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = "Role already exist") {
    super(message);
  }
}
