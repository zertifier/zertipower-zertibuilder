import {Component, computed, OnInit} from "@angular/core";
import { AuthStoreService } from "../../../features/auth/services/auth-store.service";
import { AuthApiService } from "../../../features/auth/services/auth-api.service";
import { Router } from "@angular/router";
import {Theme, ThemeStoreService} from "../../../shared/infrastructure/theme/theme-store.service";
import {capitalCase} from 'change-case';

@Component({
	selector: "app-navbar",
	templateUrl: "./navbar.component.html",
	styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
	firstname = computed(() => this.authStore.user()?.firstname);
	navbarCollapsed = true;
  isShrunk = false


  pages = [
    {
      text: 'Estadístiques',
      dbName: 'dashboard',
      iconClass: 'fa-solid fa-chart-line',
      url: '/dashboard',
      status: true
    },
    {
      text: 'Mapa',
      dbName: 'search',
      iconClass: 'fa-solid fa-map',
      url: '/search',
      status: true
    },
    {
      text: 'pedidos',
      dbName: 'orders',
      iconClass: 'fa-solid fa-box-open',
      url: '/orders',
      status: false
    },
  ]

	constructor(
		private authStore: AuthStoreService,
		private authApi: AuthApiService,
		private router: Router,
    private themeStoreService: ThemeStoreService
	) {}

  logout() {
		this.authApi.logout(this.authStore.refreshToken()!).subscribe(() => {
			this.authStore.logout();
			this.router.navigate(["/auth"]);
		});
	}

  changeTheme(theme: string) {
    switch (theme) {
      case 'light':
        this.themeStoreService.changeTheme(Theme.Light)
        break;
      case 'dark':
        this.themeStoreService.changeTheme(Theme.Dark)
        break;
      case 'auto':
        this.themeStoreService.changeTheme(Theme.Auto)
        break;
      default:
        throw new Error(`Invalid theme: '${theme}'`);
    }
  }

  getThemeIcon() {
    const theme = this.themeStoreService.theme();
    switch (theme) {
      case Theme.Auto:
        return 'bi-circle-half';
      case Theme.Dark:
        return 'bi-moon-stars-fill';
      case Theme.Light:
        return 'bi-brightness-high-fill';
    }
  }

  getThemeName() {
    return capitalCase(this.themeStoreService.theme().toString());
  }

  changeShrinkState(){
    this.isShrunk = !this.isShrunk
  }

}
