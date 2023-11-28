import { Component, computed } from "@angular/core";
import { AuthStoreService } from "../../services/auth-store/auth-store.service";
import { AuthApiService } from "../../services/auth-api/auth-api.service";
import { ObservableUtils } from "../../../../../shared/domain/ObservableUtils";
import { Router } from "@angular/router";
import { ErrorDisplayService } from "../../../../../core/core-services/error-displayer/error-display.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { WebWalletLoginComponent } from "../web-wallet/web-wallet-login/web-wallet-login.component";

@Component({
	selector: "app-web3-login-form",
	templateUrl: "./web3-login-form.component.html",
	styleUrls: ["./web3-login-form.component.scss"],
})
export class Web3LoginFormComponent {
	walletInstalled = this.authStore.ethereumProviderInstalled;
	webWalletSaved = computed(() => !!this.authStore.encryptedWallet());

	constructor(
		private authStore: AuthStoreService,
		private authApi: AuthApiService,
		private router: Router,
		private errorDisplay: ErrorDisplayService,
		private ngbModal: NgbModal,
	) {}

	async loginWithMetamask() {
		if (!this.authStore.ethereumSigner()) {
			await this.authStore.connectMetamask();
		}

		await this.login();
	}

	async loginWithWebWallet() {
		const modalRef = this.ngbModal.open(WebWalletLoginComponent);
		modalRef.closed.subscribe(() => {
			this.login();
		});
	}

	goToWebWallet() {
		this.router.navigate(["/auth/web-wallet"]);
	}

	changeWebWallet() {
		this.authStore.clearWebWallet();
		this.goToWebWallet();
	}

	private async login() {
		const signer = this.authStore.ethereumSigner()!;
		const address = await signer.getAddress();
		let code: string;
		code = await ObservableUtils.toPromise(this.authApi.getSignCode(address));
		const signature = await signer.signMessage(code);
		const { access_token, refresh_token } = await ObservableUtils.toPromise(
			this.authApi.web3Login(address, signature),
		);
		this.authStore.setTokens(access_token, refresh_token);
	}
}
