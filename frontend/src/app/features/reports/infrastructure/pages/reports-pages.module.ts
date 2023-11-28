import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ReportsPagesRoutingModule } from "./reports-pages-routing.module";
import { ReportsListPageComponent } from "./reports-list-page/reports-list-page.component";
import { CoreComponentsModule } from "../../../../core/core-components/core-components.module";
import { ReportsComponentsModule } from "../components/reports-components.module";

@NgModule({
	declarations: [ReportsListPageComponent],
	imports: [CommonModule, ReportsPagesRoutingModule, CoreComponentsModule, ReportsComponentsModule],
})
export class ReportsPagesModule {}
