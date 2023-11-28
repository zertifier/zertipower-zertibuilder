import { Injectable, signal } from "@angular/core";
import {
	PermissionResponseDTO,
	PermissionsApiService,
} from "../permissions-api/permissions-api.service";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { ObservableUtils } from "../../../../../shared/domain/ObservableUtils";

export interface Permissions {
	[role: string]: {
		[resource: string]: {
			[action: string]: boolean;
		};
	};
}

@Injectable({
	providedIn: "root",
})
export class PermissionsStoreService {
	readonly permissions = signal<Permissions>({});

	constructor(private permissionsApi: PermissionsApiService) {}

	async fetchPermissions() {
		const response = await ObservableUtils.toPromise(this.permissionsApi.get(Criteria.none()));
		const permissions: Permissions = {};
		for (const permission of response) {
			let roleGroup = permissions[permission.role];
			if (!roleGroup) {
				roleGroup = {
					[permission.resource]: {
						[permission.action]: permission.allow,
					},
				};
				permissions[permission.role] = roleGroup;
				continue;
			}

			let resourceGroup = roleGroup[permission.resource];
			if (!resourceGroup) {
				resourceGroup = {
					[permission.action]: permission.allow,
				};
				roleGroup[permission.resource] = resourceGroup;
				continue;
			}

			resourceGroup[permission.action] = permission.allow;
		}

		this.permissions.set(permissions);
	}

	async savePermissions() {
		const permissionsToSave: Array<PermissionResponseDTO> = [];
		const permissions = this.permissions();
		for (const [role, resource] of Object.entries(permissions)) {
			for (const [resourceName, action] of Object.entries(resource)) {
				for (const [actionName, allow] of Object.entries(action)) {
					permissionsToSave.push({
						role,
						resource: resourceName,
						action: actionName,
						allow,
					});
				}
			}
		}

		await ObservableUtils.toPromise(this.permissionsApi.save(permissionsToSave));
	}
}
