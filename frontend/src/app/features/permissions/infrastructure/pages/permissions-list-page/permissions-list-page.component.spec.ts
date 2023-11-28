import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PermissionsListPageComponent } from "./permissions-list-page.component";

describe("PermissionsListPageComponent", () => {
	let component: PermissionsListPageComponent;
	let fixture: ComponentFixture<PermissionsListPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [PermissionsListPageComponent],
		});
		fixture = TestBed.createComponent(PermissionsListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
