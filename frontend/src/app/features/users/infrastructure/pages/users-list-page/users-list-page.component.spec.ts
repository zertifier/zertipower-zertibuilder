import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UsersListPageComponent } from "./users-list-page.component";

describe("UsersListPageComponent", () => {
	let component: UsersListPageComponent;
	let fixture: ComponentFixture<UsersListPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [UsersListPageComponent],
		});
		fixture = TestBed.createComponent(UsersListPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
