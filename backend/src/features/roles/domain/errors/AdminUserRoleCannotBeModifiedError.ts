import { ApplicationError, ErrorCode } from '../../../../shared/domain/error';

export class AdminUserRoleCannotBeModifiedError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.BAD_REQUEST;

  constructor(message = 'ADMIN role cannot be modified') {
    super(message);
  }
}
