import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserRolesListModalComponent } from "./user-roles-list-modal.component";

describe("UserRolesListComponent", () => {
	let component: UserRolesListModalComponent;
	let fixture: ComponentFixture<UserRolesListModalComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [UserRolesListModalComponent],
		});
		fixture = TestBed.createComponent(UserRolesListModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
