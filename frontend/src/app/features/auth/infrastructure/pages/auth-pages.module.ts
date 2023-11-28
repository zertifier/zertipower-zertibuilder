import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AuthPagesRoutingModule } from "./auth-pages-routing.module";
import { LoginPageComponent } from "./login-page/login-page.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AuthComponentsModule } from "../components/auth-components.module";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { SharedComponentsModule } from "../../../../shared/infrastructure/components/shared-components.module";
import { WebWalletPageComponent } from "./web-wallet-page/web-wallet-page.component";
import { CoreComponentsModule } from "../../../../core/core-components/core-components.module";
import { OauthCallbackPageComponent } from './oauth-callback-page/oauth-callback-page.component';

@NgModule({
	declarations: [LoginPageComponent, ResetPasswordComponent, WebWalletPageComponent, OauthCallbackPageComponent],
	imports: [
		CommonModule,
		AuthPagesRoutingModule,
		FormsModule,
		AuthComponentsModule,
		ReactiveFormsModule,
		SharedComponentsModule,
		CoreComponentsModule,
	],
})
export class AuthPagesModule {}
