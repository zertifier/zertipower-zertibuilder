import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Web2LoginFormComponent } from "./web2-login-form/web2-login-form.component";
import { Web3LoginFormComponent } from "./web3-login-form/web3-login-form.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CreateWalletFormComponent } from "./web-wallet/create-wallet-form/create-wallet-form.component";
import { WebWalletLoginComponent } from "./web-wallet/web-wallet-login/web-wallet-login.component";
import { WalletInfoComponent } from "./web-wallet/wallet-info/wallet-info.component";
import { QRCodeModule } from "angularx-qrcode";
import { CoreDirectivesModule } from "../../../core/core-directives/core-directives.module";
import { DirectivesModule } from "../../../shared/infrastructure/directives/directives.module";
import { ImportPrivateKeyFormComponent } from "./web-wallet/import-private-key-form/import-private-key-form.component";
import { GoogleSigninButtonComponent } from "./google-signin-button/google-signin-button.component";

@NgModule({
	declarations: [
		Web2LoginFormComponent,
		Web3LoginFormComponent,
		CreateWalletFormComponent,
		WebWalletLoginComponent,
		WalletInfoComponent,
		ImportPrivateKeyFormComponent,
    GoogleSigninButtonComponent
	],
	exports: [
		Web2LoginFormComponent,
		Web3LoginFormComponent,
		CreateWalletFormComponent,
		WalletInfoComponent,
    GoogleSigninButtonComponent
	],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		QRCodeModule,
		CoreDirectivesModule,
		DirectivesModule,
	],
})
export class AuthComponentsModule {}
