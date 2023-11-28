import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../../environments/environment";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { map } from "rxjs";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { HttpUtils } from "../../../../../shared/infrastructure/http/HttpUtils";

export interface ApiUserResponse {
	id: number;
	username: string;
	firstname: string;
	lastname: string;
	email: string;
	wallet_address: string;
	role: string;
}

@Injectable({
	providedIn: "root",
})
export class UserApiService {
	constructor(private httpClient: HttpClient) {}

	datatables(parameters: any) {
		return this.httpClient
			.post<HttpResponse<any>>(`${environment.api_url}/users/datatables`, parameters)
			.pipe(map((response) => response.data));
	}

	getUsers(criteria: Criteria) {
		return this.httpClient
			.get<HttpResponse<ApiUserResponse[]>>(
				`${environment.api_url}/users?${HttpUtils.convertCriteriaToQueryParams(criteria)}`,
			)
			.pipe(map((response) => response.data));
	}

	saveUser(user: {
		username: string;
		firstname: string;
		lastname: string;
		email: string;
		password?: string;
		role: string;
		wallet_address?: string;
	}) {
		return this.httpClient
			.post<HttpResponse<void>>(`${environment.api_url}/users/`, user)
			.pipe(map((response) => response.data));
	}

	updateUser(
		user: {
			username: string;
			firstname: string;
			lastname: string;
			email: string;
			password?: string;
			role: string;
			wallet_address?: string;
		},
		id: number,
	) {
		return this.httpClient
			.put<HttpResponse<void>>(`${environment.api_url}/users/${id}`, user)
			.pipe(map((response) => response.data));
	}

	deleteUser(criteria: Criteria) {
		return this.httpClient.delete<void>(
			`${environment.api_url}/users?${HttpUtils.convertCriteriaToQueryParams(criteria)}`,
		);
	}
}
