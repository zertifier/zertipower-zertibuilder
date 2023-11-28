import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ReportsListPageComponent } from "./reports-list-page/reports-list-page.component";

const routes: Routes = [
	{
		path: "",
		component: ReportsListPageComponent,
	},
	{
		path: "**",
		pathMatch: "full",
		redirectTo: "",
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class ReportsPagesRoutingModule {}
