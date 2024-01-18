import { Injectable } from "@nestjs/common";
import { User } from "../../domain/User";
import { ByUsernameCriteria } from "../../domain/Username/ByUsernameCriteria";
import { UserRepository } from "../../domain/UserRepository";
import { UserAlreadyExistsError } from "../../domain/errors";
import { ByEmailCriteria } from "../../domain/Email/ByEmailCriteria";
import { PasswordUtils } from "../../domain/Password/PasswordUtils";
import { UserRoleRepository } from "../../../roles/domain/UserRoleRepository";
import { ByUserRoleName } from "../../../roles/domain/ByUserRoleName";
import { UserRoleDoesNotExistError } from "../../../roles/domain/errors";
import { FindUsersAction } from "../find-users-action/find-users-action";

/**
 * Save user ensuring there are no data inconsistency
 */
@Injectable()
export class SaveUserAction {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: UserRoleRepository,
    private findUsersAction: FindUsersAction
  ) {}

  async run(user: User) {
    // Creating criteria that search user by username that are not removed
    const byUsernameCriteria = new ByUsernameCriteria(user.username);

    // Checking if user already exist
    let fetchedUsers = await this.findUsersAction.run(byUsernameCriteria);
    if (fetchedUsers.length > 0) {
      throw new UserAlreadyExistsError(
        `User with username '${user.username}' already exists`
      );
    }

    // Creating criteria that search user by email that are not removed
    const byEmailCriteria = new ByEmailCriteria(user.email);

    // Checking if user already exist
    fetchedUsers = await this.findUsersAction.run(byEmailCriteria);
    if (fetchedUsers.length > 0) {
      throw new UserAlreadyExistsError(
        `User with email '${user.email}' already exists`
      );
    }

    // Checking role exist
    const roles = await this.roleRepository.find(
      new ByUserRoleName(user.userRole.name)
    );
    const desiredRole = roles[0];
    if (!desiredRole) {
      throw new UserRoleDoesNotExistError(
        `Role '${user.userRole.name}' does not exist`
      );
    }
    user.withUserRole(desiredRole);

    // Saving user
    user.withEncryptedPassword(await PasswordUtils.encrypt(user.password));
    return await this.userRepository.save(user);
  }
}
