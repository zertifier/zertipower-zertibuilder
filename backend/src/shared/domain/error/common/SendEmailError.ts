import { ApplicationError } from "../ApplicationError";
import { ErrorCode } from "../ErrorCode";

export class SendEmailError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;

  constructor(message = "Error sending email") {
    super(message);
  }
}
