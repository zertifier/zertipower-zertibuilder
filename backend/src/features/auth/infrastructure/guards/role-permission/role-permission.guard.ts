import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserAccessToken } from "../../../domain/tokens/UserAccessToken";
import { PrismaPermissionsRepository } from "../../repositories/prisma-permissions-repository/prisma-permissions-repository";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import {
  DontHavePermissionsError,
  PermissionDoesNotExistError,
} from "../../../domain/permissions/errors";

/**
 * This guard verifies that the user has permissions
 */
@Injectable()
export class RolePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsRepository: PrismaPermissionsRepository
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<string>(
      "resource",
      context.getHandler()
    );
    const actionName = context.getHandler().name;

    // Get JWT
    const request = context.switchToHttp().getRequest();
    const accessToken = request.decodedToken as UserAccessToken;

    if (accessToken.user.userRole.isAdmin()) {
      return true;
    }

    const permissions = await this.permissionsRepository.find(Criteria.none());
    const desiredPermission = permissions.find((permission) => {
      return (
        permission.role.name === accessToken.user.userRole.name &&
        permission.resource === resource &&
        permission.action === actionName
      );
    });
    if (!desiredPermission) {
      throw new PermissionDoesNotExistError();
    }

    if (!desiredPermission.allow) {
      throw new DontHavePermissionsError();
    }

    return true;
  }
}
