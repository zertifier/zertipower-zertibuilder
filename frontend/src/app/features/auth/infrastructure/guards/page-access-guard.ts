import {inject} from "@angular/core";
import {AuthStoreService} from "../services/auth-store/auth-store.service";
import {
  PermissionsStoreService
} from "../../../permissions/infrastructure/services/permissions-store/permissions-store.service";

export function pageAccess(page: string): () => Promise<boolean> {
  return async () => {
    const permissionsStore = inject(PermissionsStoreService);
    const authStore = inject(AuthStoreService);

    const user = authStore.user();
    if (!user) {
      throw new Error('User not defined');
    }

    await permissionsStore.fetchPermissions();
    const permissions = permissionsStore.permissions();

    return user.role === 'ADMIN' || permissions[user.role][page]['pageAccess'];
  }
}
