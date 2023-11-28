import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PermissionsListPageComponent } from "./permissions-list-page/permissions-list-page.component";

const routes: Routes = [
	{
		path: "",
		component: PermissionsListPageComponent,
	},
	{
		path: "**",
		redirectTo: "",
		pathMatch: "full",
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class PermissionsPagesRoutingModule {}
