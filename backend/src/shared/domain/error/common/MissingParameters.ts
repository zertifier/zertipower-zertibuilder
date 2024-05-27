import { ApplicationError, ErrorCode } from "..";

export class MissingParameters extends ApplicationError {
    readonly errorCode: ErrorCode = ErrorCode.MISSING_PARAMETERS;

    constructor(message = "Bad request") {
      super(message);
    }
}