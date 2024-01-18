import {
  ApplicationError,
  ErrorCode,
} from "../../../../../shared/domain/error";

export class DontHavePermissionsError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = "Don't have permissions") {
    super(message);
  }
}
