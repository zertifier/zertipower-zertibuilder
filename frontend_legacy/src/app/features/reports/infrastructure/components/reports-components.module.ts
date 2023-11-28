import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReportsDatatableComponent } from "./reports-datatable/reports-datatable.component";
import { DataTablesModule } from "angular-datatables";
import { ReportFormComponent } from "./report-form/report-form.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
	NgbAccordionBody,
	NgbAccordionButton,
	NgbAccordionCollapse,
	NgbAccordionDirective,
	NgbAccordionHeader,
	NgbAccordionItem,
} from "@ng-bootstrap/ng-bootstrap";
import { ReportViewerComponent } from "./report-viewer/report-viewer.component";
import { ReportParamsFormComponent } from "./report-params-form/report-params-form.component";

@NgModule({
	declarations: [
		ReportsDatatableComponent,
		ReportFormComponent,
		ReportViewerComponent,
		ReportParamsFormComponent,
	],
	imports: [
		CommonModule,
		DataTablesModule,
		FormsModule,
		NgbAccordionDirective,
		NgbAccordionItem,
		NgbAccordionHeader,
		NgbAccordionButton,
		NgbAccordionCollapse,
		NgbAccordionBody,
		ReactiveFormsModule,
	],
	exports: [ReportsDatatableComponent],
})
export class ReportsComponentsModule {}
