import { Component, computed, OnInit, signal } from "@angular/core";
import {
	Permissions,
	PermissionsStoreService,
} from "../../services/permissions-store/permissions-store.service";
import Swal from "sweetalert2";
import { capitalCase } from "change-case";

@Component({
	selector: "app-permissions-list-page",
	templateUrl: "./permissions-list-page.component.html",
	styleUrls: ["./permissions-list-page.component.scss"],
})
export class PermissionsListPageComponent implements OnInit {
	public readonly permissions = computed(() => {
		const permissions = this.permissionsStore.permissions();
		const filteredPermissions: Permissions = {};
		for (const [role, resource] of Object.entries(permissions)) {
			if (role !== "ADMIN") {
				filteredPermissions[role] = resource;
			}
		}
		return filteredPermissions;
	});
	public roles = computed(() => {
		return Object.keys(this.permissions());
	});
	public readonly selectedRole = signal("");
	public readonly selectedPermissions = computed(() => {
		const role = this.selectedRole();
		return this.permissions()[role];
	});
	constructor(private permissionsStore: PermissionsStoreService) {}
	async ngOnInit() {
		await this.permissionsStore.fetchPermissions();
		this.selectedRole.set(Object.keys(this.permissions()).filter((role) => role !== "ADMIN")[0]);
	}

	selectRole(role: string) {
		this.selectedRole.set(role);
	}

	updatePermission(resource: string, action: string, allow: boolean) {
		this.permissionsStore.permissions.update((permissions) => {
			permissions[this.selectedRole()][resource][action] = allow;
			return permissions;
		});
	}

	async savePermissions() {
		await this.permissionsStore.savePermissions();
		await Swal.fire({
			icon: "success",
			title: "Success",
			text: "Permissions saved successfully",
		});
	}

	protected readonly capitalCase = capitalCase;
}
