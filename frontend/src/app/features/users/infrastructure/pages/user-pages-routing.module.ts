import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { UsersListPageComponent } from "./users-list-page/users-list-page.component";

const routes: Routes = [
	{
		path: "",
		component: UsersListPageComponent,
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
export class UserPagesRoutingModule {}
