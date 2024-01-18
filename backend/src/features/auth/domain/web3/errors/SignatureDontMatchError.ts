import {
  ApplicationError,
  ErrorCode,
} from "../../../../../shared/domain/error";

export class SignatureDontMatchError extends ApplicationError {
  errorCode = ErrorCode.BAD_REQUEST;

  constructor(message = "Signature don't match") {
    super(message);
  }
}
