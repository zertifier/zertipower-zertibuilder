import {inject} from "@angular/core";
import {AuthStoreService} from "../services/auth-store.service";
import {
  PermissionsStoreService
} from "../../permissions/infrastructure/services/permissions-store/permissions-store.service";
import { Router } from "@angular/router";

export function pageAccess(page: string): () => Promise<boolean> {
  return async () => {
    const permissionsStore = inject(PermissionsStoreService);
    const authStore = inject(AuthStoreService);

    const user = authStore.user();
    console.log(user)
    if (!user) {
      console.log("user not defined")
      throw new Error('User not defined');
    }

    await permissionsStore.fetchPermissions();
    const permissions = permissionsStore.permissions();

    if (user.role !== 'ADMIN' && !permissions[user.role][page]['pageAccess'])
      window.location.href = '/select-location';
    return user.role === 'ADMIN' || permissions[user.role][page]['pageAccess'];
  }
}
