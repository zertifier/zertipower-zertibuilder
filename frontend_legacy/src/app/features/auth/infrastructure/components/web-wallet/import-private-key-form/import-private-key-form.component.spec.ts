import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportPrivateKeyFormComponent } from "./import-private-key-form.component";

describe("ImportPrivateKeyFormComponent", () => {
	let component: ImportPrivateKeyFormComponent;
	let fixture: ComponentFixture<ImportPrivateKeyFormComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			declarations: [ImportPrivateKeyFormComponent],
		});
		fixture = TestBed.createComponent(ImportPrivateKeyFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
