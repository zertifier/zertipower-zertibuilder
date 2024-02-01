import { Component } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { ethers } from "ethers";
import { ErrorDisplayService } from "../../../../../../core/core-services/error-display.service";
import { AuthStoreService } from "../../../services/auth-store/auth-store.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
	selector: "app-create-wallet-form",
	templateUrl: "./create-wallet-form.component.html",
	styleUrls: ["./create-wallet-form.component.scss"],
})
export class CreateWalletFormComponent {
	form = this.formBuilder.group({
		password1: new FormControl<string>("", Validators.required),
		password2: new FormControl<string>("", Validators.required),
	});

	constructor(
		private formBuilder: FormBuilder,
		private errorDisplay: ErrorDisplayService,
		private authStore: AuthStoreService,
		private activeModal: NgbActiveModal,
	) {}

	async createWallet() {
		if (this.form.invalid) {
			new Error("Passwords are not valid");
		}
		const wallet = ethers.Wallet.createRandom();
		const { password1, password2 } = this.form.value;
		if (!password1 || !password2) {
			throw new Error("Password is not defined");
		}

		if (password1 !== password2) {
			throw new Error("Password don't match");
		}

		const encryptedWallet = await wallet.encrypt(password1);
		this.authStore.saveWebWallet(encryptedWallet);
		await this.authStore.webWalletLogin(password1);
		this.activeModal.close();
	}

	cancel() {
		this.activeModal.dismiss();
	}
}
