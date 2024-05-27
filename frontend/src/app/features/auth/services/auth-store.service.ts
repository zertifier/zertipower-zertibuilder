import { computed, Injectable, signal } from "@angular/core";
import { ethers } from "ethers";
import { jwtDecode } from "jwt-decode";
import { AuthApiService } from "./auth-api.service";

declare let window: any;

export enum LoginMode {
	WEB2 = "WEB2",
	WEB3 = "WEB3",
}

export interface UserInterface {
	email: string;
	role: string;
	username: string;
	firstname: string;
	wallet_address?: string;
}

@Injectable({
	providedIn: "root",
})
export class AuthStoreService {
	public readonly accessToken = signal<string | undefined>(undefined);
	public readonly refreshToken = signal<string | undefined>(undefined);
	public readonly user = signal<UserInterface | undefined>(undefined, {
		equal: (a, b) => {
			try {
				return JSON.stringify(a) === JSON.stringify(b);
			} catch (_) {
				return false;
			}
		},
	});
	public readonly ethereumProvider = signal<any>(window.ethereum).asReadonly();
	public readonly ethereumProviderInstalled = computed(() => !!this.ethereumProvider());
	public readonly ethereumSigner = signal<ethers.Signer | undefined>(undefined);
	public readonly walletConnected = computed(() => !!this.ethereumSigner());
	public readonly encryptedWallet = signal<string | undefined>(undefined);
	public readonly loginMode = signal<LoginMode>(LoginMode.WEB2);

	constructor(private authApiService : AuthApiService) {
		// Getting access and refresh token
		const savedAccessToken = localStorage.getItem("accessToken") || undefined;
		const savedRefreshToken = localStorage.getItem("refreshToken") || undefined;
		if (savedAccessToken && savedRefreshToken) this.setTokens(savedAccessToken, savedRefreshToken);

		// Getting encrypted wallet from localstorage
		const encryptedWebWallet = localStorage.getItem("webWallet") || undefined;
		this.encryptedWallet.set(encryptedWebWallet);

		// Getting logout mode
		const loginMode = localStorage.getItem("loginMode") || "WEB2";
		if (
			Object.values(LoginMode)
				.map((value) => value.toString())
				.includes(loginMode)
		) {
			this.loginMode.set(loginMode as LoginMode);
		}
	}

  setWallet(wallet: ethers.Wallet) {
    this.ethereumSigner.set(wallet);
  }

	setLoginMode(loginMode: LoginMode) {
		this.loginMode.set(loginMode);
		localStorage.setItem("loginMode", loginMode);
	}

	/**
	 * Connects to metamask if it is installed
	 */
	async connectMetamask() {
		if (!this.ethereumProviderInstalled()) {
			throw new Error("Wallet not installed");
		}

		const provider = new ethers.BrowserProvider(this.ethereumProvider());
		this.ethereumSigner.set(await provider.getSigner());
	}

	setTokens(accessToken: string, refreshToken: string) {
		this.accessToken.set(accessToken);
		this.refreshToken.set(refreshToken);

		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);


		const decodedToken = jwtDecode<UserInterface>(accessToken);
		this.user.set(decodedToken);
	}

	logout() {
		this.resetState();
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
	}

	async webWalletLogin(password: string) {
		const encryptedJson = this.encryptedWallet();
		if (!encryptedJson) {
			throw Error("Encrypted wallet not saved");
		}
		const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
		this.ethereumSigner.set(wallet);
	}

	saveWebWallet(encryptedWallet: string) {
		localStorage.setItem("webWallet", encryptedWallet);
		this.encryptedWallet.set(encryptedWallet);
	}

	async importWebWallet(privateKey: string, password: string) {
		const wallet = new ethers.Wallet(privateKey);
		const encryptedWallet = await wallet.encrypt(password);
		this.ethereumSigner.set(wallet);
		this.saveWebWallet(encryptedWallet);
	}

	clearWebWallet() {
		this.ethereumSigner.set(undefined);
		this.encryptedWallet.set(undefined);
		localStorage.removeItem("webWallet");
	}

	resetState() {
		this.accessToken.set(undefined);
		this.refreshToken.set(undefined);
		this.user.set(undefined);
		this.ethereumSigner.set(undefined);
	}

	async loginWithGoogle(){
		this.logout()
		const url = this.authApiService.getCode('google');
		//await this.loadWalletFromPopup(url)

		// window.location.href = this.authApiService.getCode('google');
	  }
	  async loginWithTwitter(){
		this.logout()
		const url = this.authApiService.getCode('twitter');
		// const url = 'http://localhost:4200/dumb'
		//await this.loadWalletFromPopup(url)
	  }

	  async loginWithGithub(){
		this.logout()
		const url = this.authApiService.getCode('github');
		//await this.loadWalletFromPopup(url)
	  }
}
