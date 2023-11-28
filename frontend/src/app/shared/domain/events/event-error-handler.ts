import { of, throwError } from "rxjs";
import Swal from "sweetalert2";

export function eventErrorHandler(error: unknown) {
	if (error instanceof Error) {
		console.log(error.message);
		return throwError(() => of(error));
	}

	console.log(error);

	// Alerting user
	Swal.fire({
		icon: "error",
		title: "Unexpected error",
		text: "An unexpected error handled please contact to administrator",
	});

	return throwError(() => of(error));
}
