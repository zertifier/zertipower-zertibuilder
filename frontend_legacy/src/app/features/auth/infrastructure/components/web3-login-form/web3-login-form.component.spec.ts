import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Web3LoginFormComponent } from "./web3-login-form.component";

describe("Web3LoginFormComponent", () => {
	let component: Web3LoginFormComponent;
	let fixture: ComponentFixture<Web3LoginFormComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [Web3LoginFormComponent],
		});
		fixture = TestBed.createComponent(Web3LoginFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
