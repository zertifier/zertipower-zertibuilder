import {
  ApplicationError,
  ErrorCode,
} from '../../../../../shared/domain/error';

export class PermissionDoesNotExistError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;
  constructor(message = 'Permission does not exist') {
    super(message);
  }
}
