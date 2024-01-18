import { Injectable } from "@nestjs/common";
import { UserRole } from "../../domain/UserRole";
import {
  AdminUserRoleCannotBeModifiedError,
  UserRoleDoesNotExistError,
  UserRoleIdNotDefinedError,
} from "../../domain/errors";
import { UserRoleRepository } from "../../domain/UserRoleRepository";
import { ByUserRoleId } from "../../domain/ByUserRoleId";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RolesChangedEvent } from "../../domain/events/RolesChangedEvent";

/**
 * Modify user role information
 */
@Injectable()
export class UpdateUserRoleAction {
  constructor(
    private userRoleRepository: UserRoleRepository,
    private eventEmitter: EventEmitter2
  ) {}
  async run(role: UserRole) {
    // Role id must be defined to get role information
    if (!role.id) {
      throw new UserRoleIdNotDefinedError();
    }

    // Getting roles information
    const roles = await this.userRoleRepository.find(new ByUserRoleId(role.id));
    const fetchedRole = roles[0];
    if (!fetchedRole) {
      throw new UserRoleDoesNotExistError();
    }

    // Admin cannot change
    if (fetchedRole.isAdmin()) {
      throw new AdminUserRoleCannotBeModifiedError();
    }

    this.eventEmitter.emit(RolesChangedEvent.NAME, new RolesChangedEvent());
    // Updating role
    return await this.userRoleRepository.save(role);
  }
}
