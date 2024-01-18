import { ApplicationEvent } from "../../../../shared/domain/events/ApplicationEvent";

export class RolesChangedEvent extends ApplicationEvent<void> {
  public static NAME = "RolesChanged";
  constructor() {
    super(RolesChangedEvent.NAME, undefined);
  }
}
