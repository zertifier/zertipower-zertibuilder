import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../../domain/UserRepository";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { User } from "../../../domain/User";
import { PrismaService } from "../../../../../shared/infrastructure/services";
import {
  toPrismaFilters,
  toPrismaSorting,
} from "../../../../../shared/infrastructure/prisma/criteria";
import { InfrastructureError } from "../../../../../shared/domain/error/common";
import { PasswordNotEncryptedError } from "../../../domain/errors";
import { UserIdNotDefinedError } from "../../../domain/UserId/UserIdNotDefinedError";
import { UserRole } from "../../../../roles/domain/UserRole";
import { UserRoleDoesNotExistError } from "../../../../roles/domain/errors";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async find(criteria: Criteria): Promise<Array<User>> {
    const users = new Array<User>();
    let resultSet;
    try {
      resultSet = await this.prisma.user.findMany({
        where: toPrismaFilters(criteria),
        orderBy: toPrismaSorting(criteria),
        take: criteria.limit.value || undefined,
        skip: criteria.offset.value || undefined,
        select: {
          username: true,
          firstname: true,
          role: true,
          lastname: true,
          email: true,
          wallet_address: true,
          recover_password_code: true,
          id: true,
          password: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (err) {
      throw new InfrastructureError("Error getting users").withMetadata(err);
    }
    for (const resultSetElement of resultSet) {
      users.push(
        new User({
          username: resultSetElement.username,
          firstname: resultSetElement.firstname,
          lastname: resultSetElement.lastname,
          email: resultSetElement.email,
          password: "",
          role: new UserRole({ name: resultSetElement.role.name }).withId(
            resultSetElement.role.id
          ),
          walletAddress: resultSetElement.wallet_address || undefined,
          resetPasswordCode:
            resultSetElement.recover_password_code || undefined,
        })
          .withEncryptedPassword(resultSetElement.password)
          .withId(resultSetElement.id)
          .withCreationDate(resultSetElement.created_at)
          .withUpdateDate(resultSetElement.updated_at)
      );
    }

    return users;
  }

  async remove(criteria: Criteria): Promise<void> {
    try {
      await this.prisma.user.deleteMany({
        where: toPrismaFilters(criteria),
      });
    } catch (err) {
      throw new InfrastructureError("Error removing users").withMetadata(err);
    }
  }

  async save(user: User): Promise<User> {
    if (!user.encryptedPassword) {
      throw new PasswordNotEncryptedError();
    }
    if (!user.userRole.id) {
      const role = await this.prisma.role.findFirst({
        where: {
          name: user.userRole.name,
        },
      });
      if (!role) {
        throw new UserRoleDoesNotExistError(
          `Role ${user.userRole.name} not found`
        );
      }
      user.withUserRole(new UserRole({ name: role.name }).withId(role.id));
    }
    let createdUser;
    try {
      createdUser = await this.prisma.user.create({
        data: {
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          password: user.encryptedPassword,
          wallet_address: user.walletAddress,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          role_id: user.userRole.id!,
          recover_password_code: user.resetPasswordCode,
        },
        select: {
          username: true,
          firstname: true,
          role: true,
          lastname: true,
          email: true,
          wallet_address: true,
          recover_password_code: true,
          id: true,
          password: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (err) {
      throw new InfrastructureError("Error saving user").withMetadata(err);
    }

    return new User({
      username: createdUser.username,
      firstname: createdUser.firstname,
      lastname: createdUser.lastname,
      email: createdUser.email,
      password: "",
      role: new UserRole({ name: createdUser.role.name }).withId(
        createdUser.role.id
      ),
      walletAddress: createdUser.wallet_address || undefined,
      resetPasswordCode: createdUser.recover_password_code || undefined,
    })
      .withId(createdUser.id)
      .withEncryptedPassword(createdUser.password)
      .withCreationDate(createdUser.created_at)
      .withUpdateDate(createdUser.updated_at);
  }

  async update(user: User): Promise<User> {
    if (!user.id) {
      throw new UserIdNotDefinedError();
    }
    if (!user.encryptedPassword) {
      throw new PasswordNotEncryptedError();
    }

    const role = await this.prisma.role.findFirst({
      where: {
        name: user.userRole.name,
      },
    });
    if (!role) {
      throw new UserRoleDoesNotExistError(
        `User role '${user.userRole.name}' does not exist`
      );
    }

    user.userRole.withId(role.id);

    let updatedUser;
    try {
      updatedUser = await this.prisma.user.update({
        data: {
          username: user.username,
          wallet_address: user.walletAddress,
          role_id: user.userRole.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          password: user.encryptedPassword,
          recover_password_code: user.resetPasswordCode,
        },
        where: {
          id: user.id,
        },
        select: {
          username: true,
          firstname: true,
          role: true,
          lastname: true,
          email: true,
          wallet_address: true,
          recover_password_code: true,
          id: true,
          password: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (err) {
      throw new InfrastructureError("Error updating user").withMetadata(err);
    }

    return new User({
      username: updatedUser.username,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      password: "",
      role: new UserRole({ name: updatedUser.role.name }).withId(
        updatedUser.role.id
      ),
      walletAddress: updatedUser.wallet_address || undefined,
      resetPasswordCode: updatedUser.recover_password_code || undefined,
    })
      .withId(updatedUser.id)
      .withEncryptedPassword(updatedUser.password)
      .withCreationDate(updatedUser.created_at)
      .withUpdateDate(updatedUser.updated_at);
  }
}
