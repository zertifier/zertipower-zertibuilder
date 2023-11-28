import { Component, computed, OnDestroy, OnInit } from "@angular/core";
import { ReportStoreService } from "../../services/report-store/report-store.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ReportsApiService } from "../../services/reports-api/reports-api.service";
import { ByReportId } from "../../../domain/ByReportId";
import { ReportParamTypes } from "../../../domain/ReportParamTypes";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { Report } from "../../../domain/report";
import { ReportEventEmitterService } from "../../services/report-event-emitter/report-event-emitter.service";

@Component({
	selector: "app-report-form",
	templateUrl: "./report-form.component.html",
	styleUrls: ["./report-form.component.scss"],
})
export class ReportFormComponent implements OnInit, OnDestroy {
	editing = computed(() => !!this.reportStore.editingReportId());
	readonly paramTypes = Object.values(ReportParamTypes).map((value) => value.toString());
	params: { name: string; type: string }[] = [];
	columns: { name: string; size: number }[] = [];
	editingReport?: Report;
	editingParamIndex: number = -1;
	editingColumnIndex: number = -1;

	form = this.formBuilder.group({
		name: new FormControl<string | null>(null),
		sql: new FormControl<string | null>(null),
		paramName: new FormControl<string | null>(null),
		paramType: new FormControl<string | null>(null),
		columnName: new FormControl<string | null>(null),
		columnSize: new FormControl<number | null>(null),
		paramNameFormControl: new FormControl<string | null>(null, Validators.required),
		paramTypeFormControl: new FormControl<string | null>(null, Validators.required),
		columnNameFormControl: new FormControl<string | null>(null, Validators.required),
		columnSizeFormControl: new FormControl<number | null>(null, Validators.required),
	});

	constructor(
		private reportStore: ReportStoreService,
		private ngbActiveModal: NgbActiveModal,
		private reportApi: ReportsApiService,
		private formBuilder: FormBuilder,
		private reportEventEmitter: ReportEventEmitterService,
	) {}

	async ngOnInit(): Promise<void> {
		const reportId = this.reportStore.editingReportId();
		if (!reportId) {
			return;
		}
		const reports = await this.reportApi.get(new ByReportId(reportId));
		const report = reports[0];
		this.editingReport = report;
		this.form.controls.name.setValue(report.name);
		this.form.controls.sql.setValue(report.sql);
		this.params = [...report.params];
		this.columns = [...report.columns];
	}

	async save() {
		if (this.form.controls.sql.invalid || this.form.controls.name.invalid) {
			throw new Error("Sql and name are required");
		}

		if (this.editing()) {
			if (!this.editingReport) {
				throw new Error("Editing report not defined");
			}

			this.editingReport.columns = this.columns;
			this.editingReport.params = this.params;
			this.editingReport.sql = this.form.value.sql!;
			this.editingReport.name = this.form.value.name!;

			await this.reportApi.update(this.editingReport);
			this.reportEventEmitter.reportUpdated.emit();
			this.ngbActiveModal.close();
			return;
		}

		const newReport: Report = {
			name: this.form.value.name!,
			sql: this.form.value.sql!,
			params: this.params,
			columns: this.columns,
		};
		await this.reportApi.create(newReport);
		this.reportEventEmitter.reportSaved.emit();
		this.ngbActiveModal.close();
	}

	cancel() {
		this.ngbActiveModal.dismiss();
	}

	ngOnDestroy() {
		this.reportStore.editingReportId.set(undefined);
	}

	removeParam(index: number) {
		this.params.splice(index, 1);
	}

	removeColumn(index: number) {
		this.columns.splice(index, 1);
	}

	addParam() {
		const { paramName, paramType } = this.form.value;

		if (!paramName || !paramType) {
			throw new Error("Param name and param type are required");
		}

		this.params.push({
			name: paramName,
			type: paramType,
		});

		this.form.controls.paramName.reset();
		this.form.controls.paramType.reset();
	}

	addColumn() {
		const { columnName, columnSize } = this.form.value;

		if (!columnName || !columnSize) {
			throw new Error("Column name and size are required");
		}

		this.columns.push({
			name: columnName,
			size: columnSize,
		});

		this.form.controls.columnName.reset();
		this.form.controls.columnSize.reset();
	}

	editParam(index: number) {
		const param = this.params[index];
		if (!param) {
			throw new Error(`Param at index ${index} not found`);
		}

		this.editingParamIndex = index;

		this.form.controls.paramNameFormControl.setValue(param.name);
		this.form.controls.paramTypeFormControl.setValue(param.type);
	}

	editColumn(index: number) {
		const column = this.columns[index];
		if (!column) {
			throw new Error(`Column at index ${index} not found`);
		}

		this.editingColumnIndex = index;

		this.form.controls.columnNameFormControl.setValue(column.name);
		this.form.controls.columnSizeFormControl.setValue(column.size);
	}

	saveParam(index: number) {
		const { paramNameFormControl, paramTypeFormControl } = this.form.controls;
		if (paramNameFormControl.invalid || paramTypeFormControl.invalid) {
			throw new Error("Param data is not valid");
		}

		this.params[index] = { name: paramNameFormControl.value!, type: paramTypeFormControl.value! };

		this.editingParamIndex = -1;
	}

	saveColumn(index: number) {
		const { columnNameFormControl, columnSizeFormControl } = this.form.controls;

		if (columnNameFormControl.invalid || columnSizeFormControl.invalid) {
			throw new Error("Column data is not valid");
		}

		this.columns[index] = {
			name: columnNameFormControl.value!,
			size: columnSizeFormControl.value!,
		};

		this.editingColumnIndex = -1;
	}
}
