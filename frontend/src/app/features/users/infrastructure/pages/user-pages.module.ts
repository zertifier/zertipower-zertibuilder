import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { UserPagesRoutingModule } from "./user-pages-routing.module";
import { UsersListPageComponent } from "./users-list-page/users-list-page.component";
import { CoreComponentsModule } from "../../../../core/core-components/core-components.module";
import { UserComponentsModule } from "../components/user-components.module";
import { ReportsServicesModule } from "../../../reports/infrastructure/services/reports-services.module";

@NgModule({
	declarations: [UsersListPageComponent],
	imports: [
		CommonModule,
		UserPagesRoutingModule,
		CoreComponentsModule,
		UserComponentsModule,
		ReportsServicesModule,
	],
})
export class UserPagesModule {}
