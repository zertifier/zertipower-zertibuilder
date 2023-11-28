import { Injectable } from "@angular/core";
import { EventSubject } from "../../../../../shared/domain/events/EventSubject";

@Injectable({
	providedIn: "root",
})
export class UserEventEmitterService {
	userSaved = new EventSubject<void>();
	userUpdated = new EventSubject<void>();
	userRemoved = new EventSubject<void>();
}
