import { TestBed } from "@angular/core/testing";

import { ReportEventEmitterService } from "./report-event-emitter.service";

describe("ReportEventEmitterService", () => {
	let service: ReportEventEmitterService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ReportEventEmitterService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});
