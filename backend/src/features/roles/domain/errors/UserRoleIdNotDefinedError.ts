import { ApplicationError, ErrorCode } from '../../../../shared/domain/error';

export class UserRoleIdNotDefinedError extends ApplicationError {
  readonly errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;

  constructor(message = 'Role id not defined') {
    super(message);
  }
}
