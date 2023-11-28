import { AfterViewInit, Component, OnDestroy, Renderer2, ViewChild } from "@angular/core";
import { commonSettings } from "../../../../../shared/infrastructure/datatables/commonSettings";
import { ReportsApiService } from "../../services/reports-api/reports-api.service";
import { DataTableDirective } from "angular-datatables";
import { Subscription } from "rxjs";
import { ReportEventEmitterService } from "../../services/report-event-emitter/report-event-emitter.service";
import Swal from "sweetalert2";
import { ByReportId } from "../../../domain/ByReportId";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ReportStoreService } from "../../services/report-store/report-store.service";
import { ReportFormComponent } from "../report-form/report-form.component";
import { ReportViewerComponent } from "../report-viewer/report-viewer.component";
import { ReportParamsFormComponent } from "../report-params-form/report-params-form.component";

@Component({
	selector: "app-reports-datatable",
	templateUrl: "./reports-datatable.component.html",
	styleUrls: ["./reports-datatable.component.scss"],
})
export class ReportsDatatableComponent implements AfterViewInit, OnDestroy {
	@ViewChild(DataTableDirective, { static: false })
	datatableElement!: DataTableDirective;
	listeners: (() => void)[] = [];
	subscriptions: Subscription[] = [];
	dtOptions: DataTables.Settings = {
		...commonSettings,
		columns: [
			{ title: "Actions", data: "id" },
			{ title: "name", data: "name" },
		],
		ajax: async (parameters, callback) => {
			callback(await this.reportsApi.datatables(parameters));
		},
		columnDefs: [
			{
				targets: [0],
				render: (data, type, row) => {
					return `
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-primary action-btn" data-edit-action="edit" data-row-id="${row.id}"">
                    <i class="fa-solid fa-pen-to-square" data-edit-action="edit" data-row-id="${row.id}"></i>
                </button>
                <button class="btn btn-sm btn-danger action-btn" data-edit-action="delete" data-row-id="${row.id}">
                    <i class="fa-solid fa-xmark" data-edit-action="delete" data-row-id="${row.id}"></i>
                </button>
                <button class="btn btn-sm btn-dark action-btn" data-edit-action="see" data-row-id="${row.id}">
                    <i class="fa-solid fa-eye" data-edit-action="see" data-row-id="${row.id}"></i>
                </button>
              </div>
            `;
				},
			},
		],
	};

	constructor(
		private reportsApi: ReportsApiService,
		private reportEventEmitter: ReportEventEmitterService,
		private renderer: Renderer2,
		private ngbModal: NgbModal,
		private reportStore: ReportStoreService,
	) {}

	ngAfterViewInit() {
		this.subscriptions.push(
			this.reportEventEmitter.reportSaved.listen(() => this.refreshDatatable()),
			this.reportEventEmitter.reportUpdated.listen(() => this.refreshDatatable()),
			this.reportEventEmitter.reportRemoved.listen(() => this.refreshDatatable()),
		);
		this.listeners.push(
			this.renderer.listen(document, "click", (event) => {
				if (!event.target.hasAttribute("data-row-id")) {
					return;
				}

				const actionType = event.target.getAttribute("data-edit-action");
				const userID = event.target.getAttribute("data-row-id");

				switch (actionType) {
					case "edit":
						this.editReport(parseInt(userID));
						break;
					case "delete":
						this.deleteReport(parseInt(userID));
						break;
					case "see":
						this.seeReport(parseInt(userID));
						break;
				}
			}),
			this.renderer.listen(document, "click", (event) => {
				if (!event.target.hasAttribute("data-copy")) {
					return;
				}

				navigator.clipboard.writeText(event.target.getAttribute("data-copy"));
			}),
		);
	}

	editReport(id: number) {
		this.reportStore.editingReportId.set(id);
		this.ngbModal.open(ReportFormComponent, { size: "xl" });
	}

	async deleteReport(id: number) {
		const response = await Swal.fire({
			icon: "question",
			title: "Are you sure?",
			showCancelButton: true,
			confirmButtonText: "Delete",
		});

		if (!response.isConfirmed) {
			return;
		}

		await this.reportsApi.delete(new ByReportId(id));
		this.reportEventEmitter.reportRemoved.emit();
	}

	async seeReport(id: number) {
		this.reportStore.observedReportId.set(id);
		const reports = await this.reportsApi.get(new ByReportId(id));
		const report = reports[0];

		this.reportStore.observedReport.set(report);
		if (report.params.length) {
			const modalRef = this.ngbModal.open(ReportParamsFormComponent, { size: "xl" });
			let result;
			try {
				result = await modalRef.result;
			} catch (err) {
				throw new Error("Fill param values");
			}
			this.reportStore.cachedReportParameters.set(result);
		}

		this.ngbModal.open(ReportViewerComponent, { size: "xl" });
	}

	ngOnDestroy() {
		this.listeners.forEach((listener) => listener());
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	private async refreshDatatable() {
		const dtInstance = await this.datatableElement.dtInstance;
		dtInstance.ajax.reload();
	}
}
