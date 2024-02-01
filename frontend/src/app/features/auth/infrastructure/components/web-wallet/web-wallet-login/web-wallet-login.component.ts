import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { ErrorDisplayService } from "../../../../../../core/core-services/error-display.service";
import { AuthStoreService } from "../../../services/auth-store/auth-store.service";

@Component({
	selector: "app-web-wallet-logout",
	templateUrl: "./web-wallet-login.component.html",
	styleUrls: ["./web-wallet-login.component.scss"],
})
export class WebWalletLoginComponent {
	form = this.formBuilder.group({
		password: new FormControl<string>("", Validators.required),
	});

	constructor(
		private activeModal: NgbActiveModal,
		private formBuilder: FormBuilder,
		private errorDisplay: ErrorDisplayService,
		private authStore: AuthStoreService,
	) {}

	async save() {
		if (this.form.invalid) {
			throw new Error("Invalid form");
		}
		const { password } = this.form.value;
		if (!password) {
			throw new Error("Password not defined");
		}

		await this.authStore.webWalletLogin(password);
		this.activeModal.close();
	}

	cancel() {
		this.activeModal.dismiss();
	}
}
