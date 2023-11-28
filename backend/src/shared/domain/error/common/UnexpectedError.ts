import { ApplicationError } from '../ApplicationError';
import { ErrorCode } from '../ErrorCode';

export class UnexpectedError extends ApplicationError {
  readonly errorCode = ErrorCode.UNEXPECTED;

  constructor(message = 'Unexpected errors') {
    super(message);
  }
}
