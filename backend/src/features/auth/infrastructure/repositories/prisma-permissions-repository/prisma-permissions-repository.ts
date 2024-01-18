import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  PrismaService,
  WinstonLogger,
} from "../../../../../shared/infrastructure/services";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { toPrismaFilters } from "../../../../../shared/infrastructure/prisma/criteria";
import { InfrastructureError } from "../../../../../shared/domain/error/common";
import { Permission } from "../../../domain/permissions/Permission";
import { EnabledActions } from "../../decorators";
import { UserRole } from "../../../../roles/domain/UserRole";
import { UserRoleIdNotDefinedError } from "../../../../roles/domain/errors";
import { UserRoleRepository } from "../../../../roles/domain/UserRoleRepository";
import { OnEvent } from "@nestjs/event-emitter";
import { RolesChangedEvent } from "../../../../roles/domain/events/RolesChangedEvent";

@Injectable()
export class PrismaPermissionsRepository implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private logger: WinstonLogger,
    private userRoleRepository: UserRoleRepository
  ) {}

  async onModuleInit(): Promise<any> {
    await this.syncPermissions();
  }

  async find(criteria: Criteria) {
    const permissions = new Array<Permission>();
    let fetchedPermissions;
    try {
      fetchedPermissions = await this.prisma.permission.findMany({
        where: toPrismaFilters(criteria),
        take: criteria.limit.value || undefined,
        skip: criteria.offset.value || undefined,
        select: {
          resource: true,
          action: true,
          RolePermission: {
            select: {
              allow: true,
              role: true,
            },
          },
        },
      });
    } catch (err) {
      throw new InfrastructureError("Error getting permissions").withMetadata(
        err
      );
    }

    for (const fetchedPermission of fetchedPermissions) {
      fetchedPermission.RolePermission.forEach((rolePermission) => {
        permissions.push(
          new Permission({
            role: new UserRole({ name: rolePermission.role.name }).withId(
              rolePermission.role.id
            ),
            resource: fetchedPermission.resource,
            action: fetchedPermission.action,
            allow: rolePermission.allow,
          })
        );
      });
    }

    return permissions;
  }

  async save(permissions: Array<Permission>): Promise<void> {
    const mappedData = permissions.map((permission) => {
      return {
        role: permission.role.toString(),
        resource: permission.resource,
        action: permission.action,
        allow: permission.allow,
      };
    });

    try {
      await this.prisma.permission.createMany({
        data: mappedData,
      });
    } catch (err) {
      throw new InfrastructureError("Error saving permissions").withMetadata(
        err
      );
    }
  }

  async remove(criteria: Criteria) {
    try {
      await this.prisma.permission.deleteMany({
        where: toPrismaFilters(criteria),
      });
    } catch (err) {
      throw new InfrastructureError("Error removing permissions").withMetadata(
        err
      );
    }
  }

  async updatePermission(permission: Permission) {
    if (!permission.role.id) {
      throw new UserRoleIdNotDefinedError();
    }
    try {
      await this.prisma.permission.update({
        data: {
          RolePermission: {
            update: {
              data: {
                allow: permission.allow,
              },
              where: {
                role_id_permission_action_permission_resource: {
                  role_id: permission.role.id,
                  permission_action: permission.action,
                  permission_resource: permission.resource,
                },
              },
            },
          },
        },
        where: {
          resource_action: {
            resource: permission.resource,
            action: permission.action,
          },
        },
      });
    } catch (err) {
      throw new InfrastructureError(
        `Error updating permission ${JSON.stringify(permission.serialize())}`
      ).withMetadata(err);
    }
  }

  @OnEvent(RolesChangedEvent.NAME)
  private async syncPermissions() {
    this.logger.info("Sync permissions");
    await this.prisma.permission.deleteMany({
      where: {
        resource: {
          notIn: EnabledActions.map((action) => action.resource),
        },
        action: {
          notIn: EnabledActions.map((action) => action.action),
        },
      },
    });

    const resources = new Set(
      EnabledActions.map((enabledAction) => enabledAction.resource)
    );

    await this.prisma.permission.createMany({
      data: Array.from(resources).map((resource) => {
        return {
          resource,
          action: "pageAccess",
        };
      }),
      skipDuplicates: true,
    });

    await this.prisma.permission.createMany({
      data: EnabledActions.map((action) => ({
        resource: action.resource,
        action: action.action,
      })),
      skipDuplicates: true,
    });

    const data = new Array<{
      permission_resource: string;
      permission_action: string;
      role_id: number;
      allow: boolean;
    }>();
    const roles = await this.userRoleRepository.find(Criteria.none());
    for (const role of roles) {
      if (!role.id) {
        throw new UserRoleIdNotDefinedError();
      }
      for (const enabledAction of EnabledActions) {
        data.push({
          allow: false,
          permission_action: enabledAction.action,
          permission_resource: enabledAction.resource,
          role_id: role.id,
        });
      }
      for (const resource of resources) {
        data.push({
          allow: false,
          permission_action: "pageAccess",
          permission_resource: resource,
          role_id: role.id,
        });
      }
    }

    await this.prisma.rolePermission.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
