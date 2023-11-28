import { catchError, Subject, Subscription } from "rxjs";
import { eventErrorHandler } from "./event-error-handler";

export class EventSubject<T> {
	private subject: Subject<T> = new Subject<T>();

	emit(payload: T) {
		this.subject.next(payload);
	}

	listen(handler: (payload: T) => Promise<void>): Subscription {
		return this.subject.pipe(catchError(eventErrorHandler)).subscribe(handler);
	}
}
