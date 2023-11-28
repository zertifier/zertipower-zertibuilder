import { HttpErrorResponse } from "@angular/common/http";
import Swal from "sweetalert2";

export class HandleError {
	public static handleError(err: unknown) {
		if (err instanceof Error) {
			Swal.fire({
				icon: "error",
				text: err.message,
			});
			return;
		}

		if (err instanceof HttpErrorResponse) {
			Swal.fire({
				icon: "error",
				text: err.error.message,
			});
			return;
		}

		Swal.fire({
			icon: "error",
			text: "Cannot get sign code",
		});
		return;
	}
}
