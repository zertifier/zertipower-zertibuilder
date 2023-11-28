import { ApplicationEvent } from '../../../../shared/domain/events/ApplicationEvent';
import { User } from '../../../users/domain/User';

export class ResetPasswordRequestedEvent extends ApplicationEvent<{
  user: User;
}> {
  public static NAME = 'auth:RestPasswordRequested';

  constructor(user: User) {
    super(ResetPasswordRequestedEvent.NAME, { user });
  }
}
