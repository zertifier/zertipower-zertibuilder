import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RequiredFieldComponent } from "./required-field/required-field.component";
import { InvalidFeedbackComponent } from "./invalid-feedback/invalid-feedback.component";
import { AppDatatableComponent } from "./app-datatable/app-datatable.component";
import { DataTablesModule } from "angular-datatables";

@NgModule({
	declarations: [RequiredFieldComponent, InvalidFeedbackComponent, AppDatatableComponent],
	exports: [RequiredFieldComponent, InvalidFeedbackComponent, AppDatatableComponent],
	imports: [CommonModule, DataTablesModule],
})
export class SharedComponentsModule {}
