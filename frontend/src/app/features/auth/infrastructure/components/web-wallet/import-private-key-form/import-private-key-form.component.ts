import { Component } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { ErrorDisplayService } from "../../../../../../core/core-services/error-displayer/error-display.service";
import { AuthStoreService } from "../../../services/auth-store/auth-store.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
	selector: "app-import-private-key-form",
	templateUrl: "./import-private-key-form.component.html",
	styleUrls: ["./import-private-key-form.component.scss"],
})
export class ImportPrivateKeyFormComponent {
	form = this.formBuilder.group({
		privateKey: new FormControl<string>("", Validators.required),
		password1: new FormControl<string>("", Validators.required),
		password2: new FormControl<string>("", Validators.required),
	});

	constructor(
		private formBuilder: FormBuilder,
		private errorDisplay: ErrorDisplayService,
		private authStore: AuthStoreService,
		private activeModal: NgbActiveModal,
	) {}

	async importWallet() {
		if (this.form.invalid) {
			throw new Error("Invalid form");
		}
		const { privateKey, password1, password2 } = this.form.value;
		if (!privateKey) {
			throw new Error("Private key not defined");
		}

		if (!password1 || !password2) {
			throw new Error("Password not defined");
		}

		if (password1 !== password2) {
			throw new Error("Password don't match");
		}

		await this.authStore.importWebWallet(privateKey, password1);
		this.activeModal.close();
	}

	cancel() {
		this.activeModal.dismiss();
	}
}
