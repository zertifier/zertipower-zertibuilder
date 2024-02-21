import { Component, computed, effect, EffectRef, OnDestroy } from "@angular/core";
import { AuthStoreService, LoginMode } from "../../services/auth-store.service";
import { Router } from "@angular/router";
import { environment } from "../../../../../environments/environment";
import { ThemeStoreService } from "src/app/shared/infrastructure/theme/theme-store.service";
import {capitalCase} from "change-case";

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

	constructor(private authStore: AuthStoreService, private router: Router,private themeStoreService: ThemeStoreService) {
		effect(() => {
			if (this.authStore.user()) {
				this.router.navigate(["/"]);
			}
		});
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
}
