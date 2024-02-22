import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Criteria } from "../../../shared/domain/criteria/Criteria";
import { environment } from "../../../../environments/environment";
import { HttpUtils } from "../../../shared/infrastructure/http/HttpUtils";
import { HttpResponse } from "../../../shared/infrastructure/http/HttpResponse";
import { map } from "rxjs";

export interface UserRoleResponseDTO {
	id: number;
	name: string;
}

@Injectable({
	providedIn: "root",
})
export class UserRoleApiService {
	constructor(private httpClient: HttpClient) {}

	get(criteria: Criteria) {
		return this.httpClient
			.get<HttpResponse<Array<UserRoleResponseDTO>>>(
				`${environment.api_url}/roles?${HttpUtils.convertCriteriaToQueryParams(criteria)}`,
			)
			.pipe(map((response) => response.data));
	}

	save(role: { name: string }) {
		return this.httpClient
			.post<HttpResponse<UserRoleResponseDTO>>(`${environment.api_url}/roles`, role)
			.pipe(map((response) => response.data));
	}

	update(role: { name: string; id: number }) {
		return this.httpClient
			.put<HttpResponse<UserRoleResponseDTO>>(`${environment.api_url}/roles`, role)
			.pipe(map((response) => response.data));
	}

	delete(criteria: Criteria) {
		return this.httpClient.delete<void>(
			`${environment.api_url}/roles?${HttpUtils.convertCriteriaToQueryParams(criteria)}`,
		);
	}
}
