import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UsersTableComponent } from "./users-table/users-table.component";
import { DataTablesModule } from "angular-datatables";
import { UserFormComponent } from "./user-form/user-form.component";
import { SharedComponentsModule } from "../../../../shared/infrastructure/components/shared-components.module";
import { NgSelectModule } from "@ng-select/ng-select";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DirectivesModule } from "src/app/shared/infrastructure/directives/directives.module";
import { UserRolesListModalComponent } from "./user-roles-list/user-roles-list-modal.component";
import {AuthComponentsModule} from "../../../auth/infrastructure/components/auth-components.module";

@NgModule({
	declarations: [UsersTableComponent, UserFormComponent, UserRolesListModalComponent],
	exports: [UsersTableComponent],
	imports: [
		CommonModule,
		DataTablesModule,
		SharedComponentsModule,
		AuthComponentsModule,
		NgSelectModule,
		ReactiveFormsModule,
		DirectivesModule,
		FormsModule,
	],
})
export class UserComponentsModule {}
