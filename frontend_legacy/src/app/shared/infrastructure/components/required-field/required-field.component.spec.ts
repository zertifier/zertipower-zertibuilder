import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RequiredFieldComponent } from "./required-field.component";

describe("AppRequiredFieldComponent", () => {
	let component: RequiredFieldComponent;
	let fixture: ComponentFixture<RequiredFieldComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [RequiredFieldComponent],
		});
		fixture = TestBed.createComponent(RequiredFieldComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
