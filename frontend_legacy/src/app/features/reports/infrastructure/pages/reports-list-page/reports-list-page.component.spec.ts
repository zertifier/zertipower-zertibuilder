import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReportsListPageComponent } from "./reports-list-page.component";

describe("ReportsListPageComponent", () => {
	let component: ReportsListPageComponent;
	let fixture: ComponentFixture<ReportsListPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [ReportsListPageComponent],
		});
		fixture = TestBed.createComponent(ReportsListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
