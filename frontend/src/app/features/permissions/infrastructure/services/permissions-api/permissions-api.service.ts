import { Injectable } from "@angular/core";
import { PermissionsServicesModule } from "../permissions-services.module";
import { HttpClient } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { environment } from "../../../../../../environments/environment";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { HttpUtils } from "../../../../../shared/infrastructure/http/HttpUtils";

export interface PermissionResponseDTO {
	resource: string;
	action: string;
	role: string;
	allow: boolean;
}

@Injectable({
	providedIn: PermissionsServicesModule,
})
export class PermissionsApiService {
	constructor(private httpClient: HttpClient) {}

	get(criteria: Criteria): Observable<Array<PermissionResponseDTO>> {
		return this.httpClient
			.get<HttpResponse<Array<PermissionResponseDTO>>>(
				`${environment.api_url}/permissions?${HttpUtils.convertCriteriaToQueryParams(criteria)}`,
			)
			.pipe(map((response) => response.data));
	}

	save(permissions: Array<PermissionResponseDTO>): Observable<void> {
		return this.httpClient
			.put<HttpResponse<void>>(`${environment.api_url}/permissions`, { permissions })
			.pipe(map((response) => response.data));
	}
}
