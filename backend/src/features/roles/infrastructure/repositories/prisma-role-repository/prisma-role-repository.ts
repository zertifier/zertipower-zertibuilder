import { Injectable } from "@nestjs/common";
import { UserRoleRepository } from "../../../domain/UserRoleRepository";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { UserRole } from "../../../domain/UserRole";
import { PrismaService } from "../../../../../shared/infrastructure/services";
import {
  toPrismaFilters,
  toPrismaSorting,
} from "../../../../../shared/infrastructure/prisma/criteria";
import { InfrastructureError } from "../../../../../shared/domain/error/common";
import {
  RoleAlreadyExistError,
  UserRoleDoesNotExistError,
} from "../../../domain/errors";
import { Filter } from "../../../../../shared/domain/criteria/filter/Filter";
import { FilterField } from "../../../../../shared/domain/criteria/filter/FilterField";
import {
  FilterOperator,
  FilterOperators,
} from "../../../../../shared/domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../../../../shared/domain/criteria/filter/FilterValue";

/**
 * Implementation of role repository using prisma
 */
@Injectable()
export class PrismaRoleRepository implements UserRoleRepository {
  constructor(private prisma: PrismaService) {}

  async delete(criteria: Criteria): Promise<void> {
    try {
      await this.prisma.role.deleteMany({
        where: toPrismaFilters(criteria),
      });
    } catch (err) {
      throw new InfrastructureError("Error removing roles").withMetadata(err);
    }
  }

  async find(criteria: Criteria): Promise<Array<UserRole>> {
    const roles = new Array<UserRole>();

    let fetchedRoles;
    try {
      fetchedRoles = await this.prisma.role.findMany({
        where: toPrismaFilters(criteria),
        take: criteria.limit.value || undefined,
        skip: criteria.offset.value || undefined,
        orderBy: toPrismaSorting(criteria),
      });
    } catch (err) {
      throw new InfrastructureError(
        "Error getting roles from database"
      ).withMetadata(err);
    }

    for (const fetchedRole of fetchedRoles) {
      roles.push(
        new UserRole({
          name: fetchedRole.name,
        }).withId(fetchedRole.id)
      );
    }

    return roles;
  }

  async save(...roles: Array<UserRole>): Promise<Array<UserRole>> {
    const savedRoles = new Array<UserRole>();
    const rolesWithId: Array<UserRole> = [];
    const rolesWithoutId: Array<UserRole> = [];
    for (const role of roles) {
      if (!!role.id) {
        rolesWithId.push(role);
      } else {
        rolesWithoutId.push(role);
      }
    }

    if (rolesWithId.length !== 0) {
      savedRoles.push(...(await this.saveRolesWithId(rolesWithId)));
    }
    if (rolesWithoutId.length !== 0) {
      savedRoles.push(...(await this.saveRolesWithoutId(rolesWithoutId)));
    }

    return savedRoles;
  }

  private async saveRolesWithId(
    roles: Array<UserRole>
  ): Promise<Array<UserRole>> {
    const result = await this.prisma.role.findMany({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      where: { id: { in: roles.map((role) => role.id!) } },
    });

    if (result.length !== roles.length) {
      const existingRoleIds = result.map((resultEntry: any) => resultEntry.id);
      const nonExistingRoles = roles
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .filter((role) => !existingRoleIds.includes(role.id!))
        .map((role) => role.name);
      throw new UserRoleDoesNotExistError(
        `These roles doesn't exist [${nonExistingRoles.join(", ")}]`
      );
    }

    // Updating roles
    try {
      for (const role of roles) {
        await this.prisma.role.update({
          data: {
            name: role.name,
          },
          where: {
            id: role.id,
          },
        });
      }
    } catch (err) {
      throw new InfrastructureError("Error updating roles").withMetadata(err);
    }
    return roles;
  }

  private async saveRolesWithoutId(
    roles: Array<UserRole>
  ): Promise<Array<UserRole>> {
    const savedRoles = new Array<UserRole>();
    const result = await this.prisma.role.findMany({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      where: { name: { in: roles.map((role) => role.name) } },
    });

    if (result.length !== 0) {
      throw new RoleAlreadyExistError(
        `Roles [${result.map((role: any) => role.name)}] already exist`
      );
    }

    try {
      await this.prisma.role.createMany({
        data: roles.map((role) => {
          return {
            name: role.name,
          };
        }),
      });
    } catch (err) {
      throw new InfrastructureError("Error saving roles").withMetadata(err);
    }

    const criteria = new Criteria([
      new Filter(
        new FilterField("name"),
        new FilterOperator(FilterOperators.IN),
        new FilterValue(roles.map((role) => role.name))
      ),
    ]);
    let savedData;
    try {
      savedData = await this.prisma.role.findMany({
        where: toPrismaFilters(criteria),
      });
    } catch (err) {
      throw new InfrastructureError("Error getting saved roles").withMetadata(
        err
      );
    }

    for (const entry of savedData) {
      savedRoles.push(new UserRole({ name: entry.name }).withId(entry.id));
    }

    return savedRoles;
  }
}
