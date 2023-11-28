import { catchError, EMPTY, first, Observable } from "rxjs";

export class ObservableUtils {
	public static toPromise<T>(observable: Observable<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			observable
				.pipe(
					first(),
					catchError((err) => {
						reject(err);
						return EMPTY;
					}),
				)
				.subscribe(resolve);
		});
	}
}
