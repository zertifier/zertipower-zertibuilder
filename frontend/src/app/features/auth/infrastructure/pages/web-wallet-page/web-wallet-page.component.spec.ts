import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WebWalletPageComponent } from "./web-wallet-page.component";

describe("WebWalletPageComponent", () => {
	let component: WebWalletPageComponent;
	let fixture: ComponentFixture<WebWalletPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [WebWalletPageComponent],
		});
		fixture = TestBed.createComponent(WebWalletPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
