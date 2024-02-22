import { Component, computed, effect, EffectRef, OnDestroy } from "@angular/core";
import { AuthStoreService, LoginMode } from "../../services/auth-store.service";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "../../../../../environments/environment";
import { ThemeStoreService } from "src/app/shared/infrastructure/theme/theme-store.service";
import {capitalCase} from "change-case";
import { HttpClient } from "@angular/common/http";
import {ethers} from "ethers";
import { LoginActionService } from "../../services/login-action.service";
import { AuthApiService } from "../../services/auth-api.service";

export interface HttpResponse {
	message: string,
	success: boolean,
	data: object
  }
  
  export interface PrivateKeyHttpResponse extends HttpResponse {
	data: privateKeyObject;
  }
  
  export interface privateKeyObject{
	privateKey: string
  }

@Component({
	selector: "app-logout-page",
	templateUrl: "./login-page.component.html",
	styleUrls: ["./login-page.component.scss"],
})
export class LoginPageComponent implements OnDestroy {
	effectRefs: EffectRef[] = [];
	web2 = computed(() => this.authStore.loginMode() === LoginMode.WEB2);
	web3 = computed(() => this.authStore.loginMode() === LoginMode.WEB3);
	loginMode = computed(() => this.authStore.loginMode().toString());
	protected readonly environment = environment;

	constructor(private authStore: AuthStoreService, private router: Router,private themeStoreService: ThemeStoreService,private route: ActivatedRoute, private http: HttpClient, private loginActionService:LoginActionService, private authApiService: AuthApiService) {
		effect(() => {
			if (this.authStore.user()) {
				this.router.navigate(["/"]);
			}
		});

		this.loadWallet()
	}

	setWeb2() {
		this.authStore.setLoginMode(LoginMode.WEB2);
	}

	setWeb3() {
		this.authStore.setLoginMode(LoginMode.WEB3);
	}

	ngOnDestroy() {
		this.effectRefs.forEach((effect) => effect.destroy());
	}

	getThemeName() {
		return capitalCase(this.themeStoreService.theme().toString());
	  }

	  loadWallet() {
		this.route.queryParams.subscribe(params => {
		  const code = params['code'];
		  if (code) {
			this.getPrivateKey(code).subscribe({
			  next: (res: PrivateKeyHttpResponse) => {
				localStorage.removeItem('baseCodeChallenge');
				const privateKey = res.data.privateKey;
				const wallet = new ethers.Wallet(privateKey); //THIS IS YOUR WALLET
				console.log(wallet, "WALLET")

				this.authApiService.webWalletLogin({wallet_address:wallet.address,private_key:privateKey}).subscribe((response:any)=>{
					const access_token = response.access_token;
					const refresh_token = response.refresh_token;
					this.authStore.setTokens(access_token, refresh_token);
				})
			  },
			  error: (error) => {
				localStorage.removeItem('baseCodeChallenge');
				console.log(error)
			  }
			})
		  }
		});
	
	  }

	  getPrivateKey(code: string) {
		const url = `https://auth.zertifier.com/zauth/web3/credentials/`
		const body = {
		  code,
		  codeVerifier: localStorage.getItem('baseCodeChallenge')
		}
		return this.http.post<PrivateKeyHttpResponse>(url, body)
	
	  }
}
