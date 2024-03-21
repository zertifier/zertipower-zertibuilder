import {Component, computed, effect, EffectRef, OnDestroy, ViewEncapsulation} from "@angular/core";
import {AuthStoreService, LoginMode} from "../../services/auth-store.service";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "../../../../../environments/environment";
import {ThemeStoreService} from "src/app/shared/infrastructure/theme/theme-store.service";
import {capitalCase} from "change-case";
import {HttpClient} from "@angular/common/http";
import {ethers} from "ethers";
import {LoginActionService} from "../../services/login-action.service";
import {AuthApiService} from "../../services/auth-api.service";
import Swal from "sweetalert2";
import {Subject} from "rxjs";

export interface HttpResponse {
  message: string,
  success: boolean,
  data: object
}

export interface PrivateKeyHttpResponse extends HttpResponse {
  data: privateKeyObject;
}

export interface privateKeyObject {
  privateKey: string
  email: string
}

@Component({
  selector: "app-logout-page",
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class LoginPageComponent implements OnDestroy {
  effectRefs: EffectRef[] = [];
  web2 = computed(() => this.authStore.loginMode() === LoginMode.WEB2);
  web3 = computed(() => this.authStore.loginMode() === LoginMode.WEB3);
  loginMode = computed(() => this.authStore.loginMode().toString());
  loading: Subject<boolean> = new Subject<boolean>;
  protected readonly environment = environment;

  imgSource = ''
  images: string[] = [
    'assets/img/login-1.jpg',
    'assets/img/login-2.jpg',
    'assets/img/login-3.jpg',
    'assets/img/login-4.webp',
  ]

  constructor(private authStore: AuthStoreService, private router: Router, private themeStoreService: ThemeStoreService, private route: ActivatedRoute, private http: HttpClient, private loginActionService: LoginActionService, private authApiService: AuthApiService) {
    const randNum = Math.floor(Math.random() * this.images.length);
    this.imgSource = this.images[randNum]
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

    let that = this

    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        Swal.fire({
          title: 'Iniciant sessió...',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: function () {
            Swal.showLoading();
            that.loading.subscribe((res) => {
              Swal.close();
            })

          }
        })

        this.getPrivateKey(code).subscribe({
          next: (res: PrivateKeyHttpResponse) => {
            localStorage.removeItem('baseCodeChallenge');
            const privateKey = res.data.privateKey;
            const wallet = new ethers.Wallet(privateKey); //THIS IS YOUR WALLET
            // console.log(wallet, "WALLET")

            this.authApiService.webWalletLogin({
              wallet_address: wallet.address,
              private_key: privateKey,
              email: res.data.email
            }).subscribe((response: any) => {
              const access_token = response.access_token;
              const refresh_token = response.refresh_token;
              this.authStore.setTokens(access_token, refresh_token);
              this.loading.next(false);
            })
          },
          error: (error) => {
            localStorage.removeItem('baseCodeChallenge');
            console.log(error)
            this.loading.next(false);
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
