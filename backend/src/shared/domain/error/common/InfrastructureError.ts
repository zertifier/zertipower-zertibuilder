import { ApplicationError } from '../ApplicationError';
import { ErrorCode } from '../ErrorCode';

export class InfrastructureError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;

  constructor(message = 'Infrastructure errors') {
    super(message);
  }
}
