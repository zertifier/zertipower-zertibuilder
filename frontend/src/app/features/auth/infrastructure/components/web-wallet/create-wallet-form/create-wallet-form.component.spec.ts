import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CreateWalletFormComponent } from "./create-wallet-form.component";

describe("CreateWalletFormComponent", () => {
	let component: CreateWalletFormComponent;
	let fixture: ComponentFixture<CreateWalletFormComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [CreateWalletFormComponent],
		});
		fixture = TestBed.createComponent(CreateWalletFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
