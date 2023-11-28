import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WebWalletLoginComponent } from "./web-wallet-login.component";

describe("WebWalletLoginComponent", () => {
	let component: WebWalletLoginComponent;
	let fixture: ComponentFixture<WebWalletLoginComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [WebWalletLoginComponent],
		});
		fixture = TestBed.createComponent(WebWalletLoginComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
