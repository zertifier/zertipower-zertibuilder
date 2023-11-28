import { TestBed } from "@angular/core/testing";

import { PermissionsApiService } from "./permissions-api.service";

describe("PermissionsApiService", () => {
	let service: PermissionsApiService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(PermissionsApiService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
