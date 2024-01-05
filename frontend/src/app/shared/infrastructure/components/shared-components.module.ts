import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RequiredFieldComponent } from "./required-field/required-field.component";
import { InvalidFeedbackComponent } from "./invalid-feedback/invalid-feedback.component";
import { AppDatatableComponent } from "./app-datatable/app-datatable.component";
import { DataTablesModule } from "angular-datatables";
import {AppChartComponent} from "./chart/chart.component";

@NgModule({
	declarations: [RequiredFieldComponent, InvalidFeedbackComponent, AppDatatableComponent,AppChartComponent],
	exports: [RequiredFieldComponent, InvalidFeedbackComponent, AppDatatableComponent, AppChartComponent],
	imports: [CommonModule, DataTablesModule],
})
export class SharedComponentsModule {}
