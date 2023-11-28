import { Injectable } from "@angular/core";
import { ReportsServicesModule } from "../reports-services.module";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { HttpClient } from "@angular/common/http";
import { HttpUtils } from "../../../../../shared/infrastructure/http/HttpUtils";
import { environment } from "../../../../../../environments/environment";
import { map } from "rxjs";
import { ObservableUtils } from "../../../../../shared/domain/ObservableUtils";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { Report } from "../../../domain/report";

export interface ReportApiResponse {
	id: number;
	name: string;
	sql: string;
	columns: Array<{ name: string; size: number }>;
	params: Array<{ name: string; type: string }>;
	createdAt: string;
	updatedAt: string;
}

@Injectable({
	providedIn: ReportsServicesModule,
})
export class ReportsApiService {
	constructor(private httpClient: HttpClient) {}

	get(criteria: Criteria): Promise<Array<ReportApiResponse>> {
		return ObservableUtils.toPromise(
			this.httpClient
				.get<HttpResponse<Array<ReportApiResponse>>>(
					`${environment.api_url}/reports?${HttpUtils.convertCriteriaToQueryParams(criteria)}`,
				)
				.pipe(map((response) => response.data)),
		);
	}

	create(report: Report): Promise<ReportApiResponse> {
		return ObservableUtils.toPromise(
			this.httpClient
				.post<HttpResponse<ReportApiResponse>>(`${environment.api_url}/reports`, report)
				.pipe(map((response) => response.data)),
		);
	}

	update(report: Report): Promise<ReportApiResponse> {
		if (!report.id) {
			throw new Error("Report id not defined");
		}

		return ObservableUtils.toPromise(
			this.httpClient
				.put<HttpResponse<ReportApiResponse>>(`${environment.api_url}/reports/${report.id}`, report)
				.pipe(map((response) => response.data)),
		);
	}

	delete(criteria: Criteria) {
		return ObservableUtils.toPromise(
			this.httpClient
				.delete<HttpResponse<void>>(
					`${environment.api_url}/reports?${HttpUtils.convertCriteriaToQueryParams(criteria)}`,
				)
				.pipe(map((response) => response.data)),
		);
	}

	datatables(parameters: any) {
		return ObservableUtils.toPromise(
			this.httpClient
				.post<HttpResponse<any>>(`${environment.api_url}/reports/datatable`, parameters)
				.pipe(map((response) => response.data)),
		);
	}

	execute(id: number, datatables: any, parameters: any) {
		return ObservableUtils.toPromise(
			this.httpClient
				.post<HttpResponse<any>>(`${environment.api_url}/reports/execute/${id}`, {
					datatables,
					parameters,
				})
				.pipe(map((response) => response.data)),
		);
	}

	getData(parameters: any, id: number) {
		return ObservableUtils.toPromise(
			this.httpClient
				.post<HttpResponse<any>>(`${environment.api_url}/reports/data/${id}`, parameters)
				.pipe(map((response) => response.data)),
		);
	}

	render(parameters: any, id: number) {
		const queryParams = parameters
			? Object.entries(parameters)
					.map(([key, value]) => `${key}=${value}`)
					.join("&")
			: "";
		return ObservableUtils.toPromise(
			this.httpClient
				.get<HttpResponse<string>>(`${environment.api_url}/reports/render/${id}?${queryParams}`)
				.pipe(map((response) => response.data)),
		);
	}
}
