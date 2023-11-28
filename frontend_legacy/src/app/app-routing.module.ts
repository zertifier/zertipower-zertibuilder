import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import {loggedIn} from "./features/auth/infrastructure/guards/session-guards";
import {pageAccess} from "./features/auth/infrastructure/guards/page-access-guard";

const routes: Routes = [
	{
		path: "auth",
		loadChildren: () =>
			import("./features/auth/infrastructure/pages/auth-pages.module").then((m) => m.AuthPagesModule),
	},
	{
		path: "users",
		loadChildren: () =>
			import("./features/users/infrastructure/pages/user-pages.module").then(
				(m) => m.UserPagesModule,
			),
		canActivate: [loggedIn, pageAccess('users')],
	},
	{
		path: "permissions",
		loadChildren: () =>
			import("./features/permissions/infrastructure/pages/permissions-pages.module").then(
				(m) => m.PermissionsPagesModule,
			),
	},
	{
		path: "reports",
		loadChildren: () =>
			import("./features/reports/infrastructure/pages/reports-pages.module").then(
				(m) => m.ReportsPagesModule,
			),
    canActivate: [loggedIn, pageAccess('reports')]
	},
	{
		path: "**",
		pathMatch: "full",
		redirectTo: "users",
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
