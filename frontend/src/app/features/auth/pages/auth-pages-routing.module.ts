import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LoginPageComponent } from "./login-page/login-page.component";
import { loggedOut as ifNotLoggedIn } from "../guards/session-guards";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { WebWalletPageComponent } from "./web-wallet-page/web-wallet-page.component";
import { web3Enabled } from "../guards/login-type-guards";
import {OauthCallbackPageComponent} from "./oauth-callback-page/oauth-callback-page.component";

const routes: Routes = [
	{
		path: "",
		component: LoginPageComponent,
		canActivate: [ifNotLoggedIn],
	},
  {
    path: "oauth-callback",
    component: OauthCallbackPageComponent,
  },
	{
		path: "web-wallet",
		component: WebWalletPageComponent,
		canActivate: [web3Enabled],
	},
	{
		path: "reset-password/:code",
		component: ResetPasswordComponent,
	},
	{
		path: "**",
		redirectTo: "",
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AuthPagesRoutingModule {}
