import { TestBed } from "@angular/core/testing";

import { UserEventEmitterService } from "./user-event-emitter.service";

describe("UserEventEmitterService", () => {
	let service: UserEventEmitterService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(UserEventEmitterService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
