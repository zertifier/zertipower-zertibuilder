import { TestBed } from "@angular/core/testing";

import { UserRoleApiService } from "./user-role-api.service";

describe("RoleApiService", () => {
	let service: UserRoleApiService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(UserRoleApiService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
