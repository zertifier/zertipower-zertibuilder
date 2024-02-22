import { Component } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserFormComponent } from "../../components/user-form/user-form.component";
import { UserRolesListModalComponent } from "../../components/user-roles-list/user-roles-list-modal.component";

@Component({
	selector: "app-users-list-page",
	templateUrl: "./users-list-page.component.html",
	styleUrls: ["./users-list-page.component.scss"],
})
export class UsersListPageComponent {
	constructor(private ngbModal: NgbModal) {}

	openRolesModal() {
		this.ngbModal.open(UserRolesListModalComponent, { size: "xl" });
	}

	addUser() {
		this.ngbModal.open(UserFormComponent);
	}
}
