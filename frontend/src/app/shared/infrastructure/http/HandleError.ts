import { HttpErrorResponse } from "@angular/common/http";
import Swal from "sweetalert2";

export class HandleError {
	public static handleError(err: unknown) {
		if (err instanceof Error) {
			console.log("ERROR 1",err)
			Swal.fire({
				icon: "error",
				text: err.message,
			});
			return;
		}

		if (err instanceof HttpErrorResponse) {
			console.log("ERROR 2",err.error)
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
