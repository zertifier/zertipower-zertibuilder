import { ErrorHandler, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { AccessTokenInterceptor } from "./core/interceptors/access-token/access-token.interceptor";
import { NgSelectModule } from "@ng-select/ng-select";
import { SharedComponentsModule } from "./shared/infrastructure/components/shared-components.module";
import { CoreComponentsModule } from "./core/core-components/core-components.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EditorModule, TINYMCE_SCRIPT_SRC } from "@tinymce/tinymce-angular";
import { CoreServicesModule } from "./core/core-services/core-services.module";
import { QRCodeModule } from "angularx-qrcode";
import { ErrorDisplayService } from "./core/core-services/error-displayer/error-display.service";
import { PermissionsServicesModule } from "./features/permissions/infrastructure/services/permissions-services.module";
import { ReportsServicesModule } from "./features/reports/infrastructure/services/reports-services.module";
import {DashboardModule} from "./features/dashboard/dashboard.module";

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		NgbModule,
		HttpClientModule,
		NgSelectModule,
		SharedComponentsModule,
		CoreComponentsModule,
		ReactiveFormsModule,
		EditorModule,
		CoreServicesModule,
		QRCodeModule,
		PermissionsServicesModule,
		ReportsServicesModule
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: AccessTokenInterceptor, multi: true },
		{ provide: TINYMCE_SCRIPT_SRC, useValue: "tinymce/tinymce.min.js" },
		{
			provide: ErrorHandler,
			useClass: ErrorDisplayService,
		},
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
