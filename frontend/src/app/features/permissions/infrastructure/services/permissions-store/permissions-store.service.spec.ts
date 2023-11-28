import { TestBed } from "@angular/core/testing";

import { PermissionsStoreService } from "./permissions-store.service";

describe("PermissionsStoreService", () => {
	let service: PermissionsStoreService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(PermissionsStoreService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
