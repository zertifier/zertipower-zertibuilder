import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ApplicationEvent } from "../../domain/events/ApplicationEvent";

/**
 * Class abstraction to emit events. It is the preferred.
 */
@Injectable()
export class EventEmitter {
  constructor(private eventEmitter: EventEmitter2) {}

  emit<T>(event: ApplicationEvent<T>) {
    this.eventEmitter.emit(event.name, event);
  }
}
