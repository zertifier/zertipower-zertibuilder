import { Injectable } from '@nestjs/common';
import { UserRoleRepository } from '../../domain/UserRoleRepository';
import { UserRole } from '../../domain/UserRole';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RolesChangedEvent } from '../../domain/events/RolesChangedEvent';

/**
 * Create a new role
 */
@Injectable()
export class SaveUserRoleAction {
  constructor(
    private roleRepository: UserRoleRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  async run(roleToSave: UserRole) {
    const savedRole = await this.roleRepository.save(roleToSave);
    this.eventEmitter.emit(RolesChangedEvent.NAME, new RolesChangedEvent());
    return savedRole;
  }
}
