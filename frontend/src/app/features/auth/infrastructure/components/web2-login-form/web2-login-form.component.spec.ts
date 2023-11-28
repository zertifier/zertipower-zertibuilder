import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Web2LoginFormComponent } from "./web2-login-form.component";

describe("Web2LoginFormComponent", () => {
	let component: Web2LoginFormComponent;
	let fixture: ComponentFixture<Web2LoginFormComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [Web2LoginFormComponent],
		});
		fixture = TestBed.createComponent(Web2LoginFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
