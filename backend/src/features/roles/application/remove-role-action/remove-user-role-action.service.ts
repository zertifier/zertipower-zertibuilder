import { Injectable } from '@nestjs/common';
import { Criteria } from '../../../../shared/domain/criteria/Criteria';
import { UserRoleRepository } from '../../domain/UserRoleRepository';
import { AdminUserRoleCannotBeModifiedError } from '../../domain/errors';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RolesChangedEvent } from '../../domain/events/RolesChangedEvent';

/**
 * Remove a role from database
 */
@Injectable()
export class RemoveUserRoleAction {
  constructor(
    private roleRepository: UserRoleRepository,
    private eventEmitter: EventEmitter2,
  ) {}
  async run(criteria: Criteria) {
    const roles = await this.roleRepository.find(criteria);
    for (const role of roles) {
      if (role.isAdmin()) {
        throw new AdminUserRoleCannotBeModifiedError(
          'Cannot remove ADMIN role',
        );
      }
    }
    await this.roleRepository.delete(criteria);
    this.eventEmitter.emit(RolesChangedEvent.NAME, new RolesChangedEvent());
  }
}
