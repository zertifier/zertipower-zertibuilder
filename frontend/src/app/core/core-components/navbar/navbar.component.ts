import {Component, computed, effect, OnInit} from "@angular/core";
import { AuthStoreService } from "../../../features/auth/services/auth-store.service";
import { AuthApiService } from "../../../features/auth/services/auth-api.service";
import { Router } from "@angular/router";
import {Theme, ThemeStoreService} from "../../../shared/infrastructure/theme/theme-store.service";
import {capitalCase} from 'change-case';
import {
  PermissionsStoreService
} from "../../../features/permissions/infrastructure/services/permissions-store/permissions-store.service";

@Component({
	selector: "app-navbar",
	templateUrl: "./navbar.component.html",
	styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
	firstname = computed(() => this.authStore.user()?.firstname);
	navbarCollapsed = true;
  isShrunk = false;
  hasAuth=false;

  pages = [
    {
      text: 'Estadístiques',
      dbName: 'dashboard',
      iconClass: 'fa-solid fa-chart-line',
      url: '/dashboard',
      status: false
     } 
  ]

	constructor(
		protected authStore: AuthStoreService,
		private authApi: AuthApiService,
		private router: Router,
    protected themeStoreService: ThemeStoreService,
    private permissionsStoreService: PermissionsStoreService,
	) {

    effect(async () => {
      await permissionsStoreService.fetchPermissions();
      const user = authStore.user();
      if (user) {
        const permissions = this.permissionsStoreService.permissions()[user.role]
        if (user.role == 'ADMIN' || user.role == 'PRESIDENT'){
          this.pages[0].status = true;
          this.hasAuth=true;
        } 
        
        this.setPermmittedPages(permissions)
      }



    });
  }

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

  setPermmittedPages(permissions: any){
    // const user = this.authStore.user();

    Object.keys(permissions)
      .map(page => {
        if (permissions[page]['pageAccess']){
          for (const pageElement of this.pages) {
            if (pageElement.dbName === page) {
              pageElement.status = true;
            }
          }
        }
      });

  }

}
