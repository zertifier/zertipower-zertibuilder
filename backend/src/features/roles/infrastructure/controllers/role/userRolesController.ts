import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { HttpResponse } from '../../../../../shared/infrastructure/http/HttpResponse';
import { UserRoleRepository } from '../../../domain/UserRoleRepository';
import { QueryFilterDto } from '../../../../../shared/infrastructure/http/QueryFiltersDto';
import { HttpUtils } from '../../../../../shared/infrastructure/http/HttpUtils';
import { getRolesFilterSchema } from './filter-schemas/get-role-filter-schema';
import { ApiTags } from '@nestjs/swagger';
import { UserRoleDTOMapper } from './DTOs/RoleDTO';
import { RequestSaveRoleDTO } from './DTOs/RequestSaveRoleDTO';
import { UserRole } from '../../../domain/UserRole';
import { RequestUpdateRoleDTO } from './DTOs/RequestUpdateRoleDTO';
import { RemoveUserRoleAction } from '../../../application/remove-role-action/remove-user-role-action.service';
import { UpdateUserRoleAction } from '../../../application/update-role-action/update-user-role-action.service';
import { SaveUserRoleAction } from '../../../application/save-role-action/save-user-role-action.service';

@ApiTags('roles')
@Controller('roles')
export class UserRolesController {
  constructor(
    private rolesRepository: UserRoleRepository,
    private removeUserRoleAction: RemoveUserRoleAction,
    private updateUserRoleAction: UpdateUserRoleAction,
    private saveUserRoleAction: SaveUserRoleAction,
  ) {}

  /**
   * Get roles
   * @param query
   */
  @Get()
  async getRoles(@Query() query: QueryFilterDto) {
    const criteria = HttpUtils.parseFiltersFromQueryFilters(
      query,
      getRolesFilterSchema,
    );
    const data = await this.rolesRepository.find(criteria);
    return HttpResponse.success('Roles fetched successfully').withData(
      data.map(UserRoleDTOMapper.toDTO),
    );
  }

  /**
   * Create a new role
   * @param role
   */
  @Post()
  async saveRole(@Body() role: RequestSaveRoleDTO) {
    const roleToSave = new UserRole({ name: role.name });
    const savedRoles = await this.saveUserRoleAction.run(roleToSave);
    return HttpResponse.success('Role saved successfully').withData(
      UserRoleDTOMapper.toDTO(savedRoles[0]),
    );
  }

  /**
   * Update roles information
   * @param role
   */
  @Put()
  async updateRoles(@Body() role: RequestUpdateRoleDTO) {
    const roleToSave = new UserRole({ name: role.name }).withId(role.id);
    const savedRoles = await this.updateUserRoleAction.run(roleToSave);
    return HttpResponse.success('Role updated successfully').withData(
      UserRoleDTOMapper.toDTO(savedRoles[0]),
    );
  }

  /**
   * Remove role
   * @param query
   */
  @Delete()
  async deleteRoles(@Query() query: QueryFilterDto) {
    const criteria = HttpUtils.parseFiltersFromQueryFilters(
      query,
      getRolesFilterSchema,
    );
    await this.removeUserRoleAction.run(criteria);
    return HttpResponse.success('Roles removed successfully');
  }
}
