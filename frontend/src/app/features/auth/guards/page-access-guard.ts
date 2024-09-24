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
    const router = inject(Router);

    const user = authStore.user();
    if (!user) {
      console.log("user not defined")
      throw new Error('User not defined');
    }

    await permissionsStore.fetchPermissions();
    const permissions = permissionsStore.permissions();

    //console.log('error?',permissions[user.role][page]['pageAccess'],permissions[user.role][page],permissions[user.role]);

    if (user.role !== 'ADMIN' && user.role !== 'PRESIDENT' && !permissions[user.role][page]['pageAccess']){
      console.log("Not permitted" , permissions[user.role][page]['pageAccess'])
      router.navigate(["auth"]); //todo: no funciona?
    }
      
    return user.role === 'ADMIN' ||user.role === 'PRESIDENT' || permissions[user.role][page]['pageAccess'];
  }
}
