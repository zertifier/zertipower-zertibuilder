import { Component, OnInit, signal } from "@angular/core";
import {
	UserRoleApiService,
	UserRoleResponseDTO,
} from "../../services/user-role-api.service";
import { Criteria } from "../../../../shared/domain/criteria/Criteria";
import { ObservableUtils } from "../../../../shared/domain/ObservableUtils";
import { Filter } from "../../../../shared/domain/criteria/filter/Filter";
import { FilterField } from "../../../../shared/domain/criteria/filter/FilterField";
import {
	FilterOperator,
	FilterOperators,
} from "../../../../shared/domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../../../shared/domain/criteria/filter/FilterValue";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Confirmable } from "../../../../shared/infrastructure/decorators/Confirmable";
import { Router } from "@angular/router";

@Component({
	selector: "app-user-roles-list",
	templateUrl: "./user-roles-list-modal.component.html",
	styleUrls: ["./user-roles-list-modal.component.scss"],
})
export class UserRolesListModalComponent implements OnInit {
	public roles = signal<Array<UserRoleResponseDTO>>([]);
	public editingRoleId = 0;
	public editingRoleName = "";
	public newRoleName = "";
	constructor(
		private userRolesApi: UserRoleApiService,
		private activeModal: NgbActiveModal,
		private router: Router,
	) {}

	async ngOnInit(): Promise<void> {
		await this.loadRoles();
	}

	async loadRoles() {
		const roles = await ObservableUtils.toPromise(this.userRolesApi.get(Criteria.none()));

		this.roles.set(roles);
	}

	editRole(role: UserRoleResponseDTO) {
		this.editingRoleId = role.id;
		this.editingRoleName = role.name;
	}

	async saveRole(name: string) {
		await ObservableUtils.toPromise(this.userRolesApi.save({ name }));
		await this.loadRoles();
		this.newRoleName = "";
	}

	@Confirmable("Are you sure?")
	async removeRole(roleToRemove: UserRoleResponseDTO) {
		await ObservableUtils.toPromise(
			this.userRolesApi.delete(
				new Criteria([
					new Filter(
						new FilterField("id"),
						new FilterOperator(FilterOperators.EQUAL),
						new FilterValue(roleToRemove.id),
					),
				]),
			),
		);
		await this.loadRoles();
	}

	async updateRole(roleToSave: UserRoleResponseDTO) {
		roleToSave.name = this.editingRoleName;
		await ObservableUtils.toPromise(this.userRolesApi.update(roleToSave));
		this.roles.update((roles) => {
			for (const role of roles) {
				if (role.id === roleToSave.id) {
					role.name = roleToSave.name;
					return roles;
				}
			}

			return roles;
		});
		this.cancelEdition();
	}

	cancelEdition() {
		this.editingRoleId = 0;
	}

	closeModal() {
		this.activeModal.close();
	}

	goToSettings() {
		this.router.navigate(["/permissions"]);
		this.closeModal();
	}
}
