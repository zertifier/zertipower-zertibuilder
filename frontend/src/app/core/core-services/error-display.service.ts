import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable({
	providedIn: CoreServicesModule,
})
export class ErrorDisplayService implements ErrorHandler {
	constructor(private zone: NgZone) {}

	handleError(error: any): void {
		let err = error.rejection;

		if (!err) {
			//console.error(error);
			//this.displayError(error);
			return;
		}

		if (err instanceof HttpErrorResponse) {
			err = new Error(err.error);
		}

		this.zone.run(() => {
			//this.displayError(err);
		});

		console.error("Error from global error handler", err);
	}

	private async displayError(error: any) {
		console.log(error)
		if(error.error && error.error.message){
			await Swal.fire({
				icon: "error",
				title: "Error",
				text: error.error.message,
			});
		}else {
			await Swal.fire({
				icon: "error",
				title: "Error",
				text: error.message,
			});
		}
		
	}
}
