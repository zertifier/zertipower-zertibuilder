import { Component } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ReportFormComponent } from "../../components/report-form/report-form.component";

@Component({
	selector: "app-reports-list-page",
	templateUrl: "./reports-list-page.component.html",
	styleUrls: ["./reports-list-page.component.scss"],
})
export class ReportsListPageComponent {
	constructor(private ngbModal: NgbModal) {}
	addReport() {
		this.ngbModal.open(ReportFormComponent, { size: "xl" });
	}
}
