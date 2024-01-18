import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { AccessTokenGuard } from "../guards/access-token-guard/access-token-guard";
import { RolePermissionGuard } from "../guards/role-permission/role-permission.guard";

export const EnabledActions: Array<{ action: string; resource: string }> = [];
/**
 * This decorator sets name for action allowing to modify permissions for this action.
 * @constructor
 * @param resource
 */
export const EnablePermissions = function (resource: string) {
  return function (target: any, propertyKey: string) {
    // Save entry to database if not exist
    EnabledActions.push({ resource, action: propertyKey });
  };
};

export function Auth(resource: string) {
  return applyDecorators(
    EnablePermissions(resource),
    SetMetadata("resource", resource),
    UseGuards(AccessTokenGuard, RolePermissionGuard)
  );
}
