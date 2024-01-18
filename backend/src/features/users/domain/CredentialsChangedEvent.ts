import { ApplicationEvent } from "../../../shared/domain/events/ApplicationEvent";

export class CredentialsChangedEvent extends ApplicationEvent<{
  userID: number;
}> {
  public static NAME = "users:Credentials changed";

  constructor(payload: { userID: number }) {
    super(CredentialsChangedEvent.NAME, payload);
  }
}
