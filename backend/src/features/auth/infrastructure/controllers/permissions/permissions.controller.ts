import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { PrismaPermissionsRepository } from '../../repositories/prisma-permissions-repository/prisma-permissions-repository';
import { HttpUtils } from '../../../../../shared/infrastructure/http/HttpUtils';
import { QueryFilterDto } from '../../../../../shared/infrastructure/http/QueryFiltersDto';
import { getPermissionsFilterSchema } from './filter-schemas/get-permissions-filter.schema';
import { HttpResponse } from '../../../../../shared/infrastructure/http/HttpResponse';
import { PermissionsDTOMapper } from './DTOs/PermissionsDTO';
import { RequestSavePermissionDTO } from './DTOs/RequestSavePermissionDTO';
import { UserRoleRepository } from '../../../../roles/domain/UserRoleRepository';
import { Filter } from '../../../../../shared/domain/criteria/filter/Filter';
import { FilterField } from '../../../../../shared/domain/criteria/filter/FilterField';
import { Criteria } from '../../../../../shared/domain/criteria/Criteria';
import {
  FilterOperator,
  FilterOperators,
} from '../../../../../shared/domain/criteria/filter/FilterOperator';
import { FilterValue } from '../../../../../shared/domain/criteria/filter/FilterValue';
import { UserRoleDoesNotExistError } from '../../../../roles/domain/errors';
import { ErrorCode } from '../../../../../shared/domain/error';
import { Permission } from '../../../domain/permissions/Permission';

@Controller('permissions')
export class PermissionsController {
  constructor(
    private permissionsRepository: PrismaPermissionsRepository,
    private userRolesRepository: UserRoleRepository,
  ) {}

  /**
   * Get saved permissions
   * @param query
   */
  @Get()
  async getPermissions(@Query() query: QueryFilterDto) {
    const criteria = HttpUtils.parseFiltersFromQueryFilters(
      query,
      getPermissionsFilterSchema,
    );
    const permissions = await this.permissionsRepository.find(criteria);
    return HttpResponse.success('Permissions fetched successfully').withData(
      permissions.map(PermissionsDTOMapper.toDTO),
    );
  }

  /**
   * This method is used to save and override permissions
   */
  @Put()
  async savePermission(@Body() body: RequestSavePermissionDTO) {
    const rawRoles = body.permissions.map((permission) => {
      return permission.role;
    });

    // Checking role existence
    const roles = Array.from(new Set(rawRoles));
    const fetchedRoles = await this.userRolesRepository.find(
      new Criteria([
        new Filter(
          new FilterField('name'),
          new FilterOperator(FilterOperators.IN),
          new FilterValue(roles),
        ),
      ]),
    );
    if (fetchedRoles.length !== roles.length) {
      const nonExistingRoles = roles.filter((role) => {
        return !fetchedRoles
          .map((fetchedRole) => fetchedRole.name)
          .includes(role);
      });
      throw new UserRoleDoesNotExistError(
        `Roles [${nonExistingRoles.join(', ')}] doesn't exist`,
      );
    }

    // Get permissions
    const permissions = await this.permissionsRepository.find(Criteria.none());
    // Filter invalid or duplicated permissions

    // Check duplicated permissions
    const permissionsCounter: { [key: string]: number } = {};
    body.permissions.forEach((permission) => {
      const key = `${permission.resource}.${permission.action}.${permission.role}`;
      const counter = permissionsCounter[key] || 0;
      permissionsCounter[key] = counter + 1;
    });
    const duplicated = !!Object.values(permissionsCounter).find(
      (counter) => counter > 1,
    );
    if (duplicated) {
      // Collecting duplicated permissions
      const duplicatedPermissions = Object.entries(permissionsCounter)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, value]) => value > 1)
        .map(([key, count]) => {
          const [resource, action, role] = key.split('.');
          return {
            resource,
            action,
            role,
            count,
          };
        });
      return HttpResponse.failure(
        'Duplicated permissions',
        ErrorCode.BAD_REQUEST,
      ).withData(duplicatedPermissions);
    }

    // Check invalid permissions
    const validPermissionKeys = permissions.map(
      (permission) =>
        `${permission.resource}.${permission.action}.${permission.role.name}`,
    );
    const receivedPermissionKeys = body.permissions.map(
      (permission) =>
        `${permission.resource}.${permission.action}.${permission.role}`,
    );
    const invalidPermissionKeys = receivedPermissionKeys.filter(
      (receivedPermissionKey) => {
        return !validPermissionKeys.includes(receivedPermissionKey);
      },
    );
    if (invalidPermissionKeys.length) {
      return HttpResponse.failure(
        "Permissions doesn't exist",
        ErrorCode.BAD_REQUEST,
      ).withData(invalidPermissionKeys);
    }

    // Update permissions
    const permissionsToSave = body.permissions
      .map((permissionDTO) => {
        const { resource, action, role, allow } = permissionDTO;
        const userRole = fetchedRoles.find(
          (fetchedRole) => fetchedRole.name === role,
        );

        if (!userRole) {
          throw new UserRoleDoesNotExistError(
            `User role '${role}' does not exist`,
          );
        }

        return new Permission({
          resource,
          action,
          allow,
          role: userRole,
        });
      })
      .filter((permission) => !permission.role.isAdmin());

    for (const permission of permissionsToSave) {
      await this.permissionsRepository.updatePermission(permission);
    }

    return HttpResponse.success('Permissions saved successfully');
  }
}
