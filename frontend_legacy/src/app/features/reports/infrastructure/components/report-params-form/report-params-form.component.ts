import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ReportStoreService } from "../../services/report-store/report-store.service";
import { Report } from "../../../domain/report";
import { ReportParamTypes } from "../../../domain/ReportParamTypes";
import * as moment from "moment";

@Component({
	selector: "app-report-params-form",
	templateUrl: "./report-params-form.component.html",
	styleUrls: ["./report-params-form.component.scss"],
})
export class ReportParamsFormComponent {
	form: FormGroup;
	report: Report;

	constructor(
		private activeModal: NgbActiveModal,
		private formBuilder: FormBuilder,
		private reportStore: ReportStoreService,
	) {
		const formControls: { [name: string]: FormControl } = {};
		const report = this.reportStore.observedReport();
		if (!report) {
			throw new Error("Report not defined");
		}

		this.report = report;

		for (let param of report.params) {
			if (
				[ReportParamTypes.INTEGER, ReportParamTypes.DECIMAL].includes(
					param.type as ReportParamTypes,
				)
			) {
				formControls[param.name] = new FormControl<number | null>(null, Validators.required);
			}
			if (
				[ReportParamTypes.DATE, ReportParamTypes.STRING].includes(param.type as ReportParamTypes)
			) {
				formControls[param.name] = new FormControl<string | null>(null, Validators.required);
			}
			formControls[param.name] = new FormControl<boolean | null>(null, Validators.required);
		}

		this.form = this.formBuilder.group(formControls);
	}
	save() {
		if (this.form.invalid) {
			throw new Error("Invalid form");
		}
		const values = this.form.value;
		let parsedValues: any = {};
		for (const param of this.report.params) {
			const rawValue = values[param.name];
			if (param.type === ReportParamTypes.INTEGER) {
				const parsedValue = parseInt(rawValue);
				if (!parsedValue) {
					throw new Error(`Error parsing parameter '${param.name}'`);
				}
				parsedValues[param.name] = parsedValue;
				continue;
			}
			if (param.type === ReportParamTypes.DECIMAL) {
				const parsedValue = parseFloat(rawValue);
				if (!parsedValue) {
					throw new Error(`Error parsing parameter '${param.name}'`);
				}
				parsedValues[param.name] = parsedValue;
				continue;
			}
			if (param.type === ReportParamTypes.DATE) {
				const parsedValue = moment(rawValue, "YYYY-MM-DDTHH:mm");
				if (!parsedValue.isValid()) {
					throw new Error("Date is not valid");
				}
				parsedValues[param.name] = parsedValue.format("YYYY-MM-DD HH:mm");
				continue;
			}
			parsedValues[param.name] = rawValue;
		}
		this.activeModal.close(parsedValues);
	}

	getInputType(paramType: string) {
		if (
			!Object.values(ReportParamTypes)
				.map((val) => val.toString())
				.includes(paramType)
		) {
			throw new Error(`Invalid param type '${paramType}'`);
		}

		switch (paramType as ReportParamTypes) {
			case ReportParamTypes.BOOLEAN:
				return "checkbox";
			case ReportParamTypes.DECIMAL:
				return "number";
			case ReportParamTypes.INTEGER:
				return "number";
			case ReportParamTypes.STRING:
				return "text";
			case ReportParamTypes.DATE:
				return "datetime-local";
		}
	}
}
