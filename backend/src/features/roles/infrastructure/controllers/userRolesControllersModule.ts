import { Module } from '@nestjs/common';
import { UserRolesController } from './role/userRolesController';
import { UserRolesRepositoriesModule } from '../repositories/userRolesRepositoriesModule';
import { UserRolesActionsModule } from '../../application/user-roles-actions.module';

@Module({
  controllers: [UserRolesController],
  imports: [UserRolesRepositoriesModule, UserRolesActionsModule],
})
export class UserRolesControllersModule {}
