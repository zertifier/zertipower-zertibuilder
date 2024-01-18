import { ApplicationError } from "../ApplicationError";
import { ErrorCode } from "../ErrorCode";

export class InvalidArgumentError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;

  constructor(message = "Invalid argument") {
    super(message);
  }
}
