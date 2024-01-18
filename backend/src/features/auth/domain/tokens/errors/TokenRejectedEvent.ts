import { ApplicationEvent } from "../../../../../shared/domain/events/ApplicationEvent";

export class TokenRejectedEvent extends ApplicationEvent<{ token: string }> {
  public static NAME = "auth:TokenRejected";

  constructor(token: string) {
    super(TokenRejectedEvent.NAME, { token });
  }
}
