import { Component } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CreateWalletFormComponent } from "../../components/web-wallet/create-wallet-form/create-wallet-form.component";
import { Router } from "@angular/router";
import { AuthStoreService } from "../../services/auth-store/auth-store.service";
import { ImportPrivateKeyFormComponent } from "../../components/web-wallet/import-private-key-form/import-private-key-form.component";

@Component({
	selector: "app-web-wallet-page",
	templateUrl: "./web-wallet-page.component.html",
	styleUrls: ["./web-wallet-page.component.scss"],
})
export class WebWalletPageComponent {
	walletConnected = this.authStore.walletConnected;

	constructor(
		private ngbModal: NgbModal,
		private router: Router,
		private authStore: AuthStoreService,
	) {}

	createWallet() {
		this.ngbModal.open(CreateWalletFormComponent);
	}

	importPrivateKey() {
		this.ngbModal.open(ImportPrivateKeyFormComponent);
	}

	login() {
		this.router.navigate(["auth"]);
	}
}
