import { Module } from '@nestjs/common';
import { UserRoleRepository } from '../../domain/UserRoleRepository';
import { PrismaRoleRepository } from './prisma-role-repository/prisma-role-repository';
import { SharedServicesModule } from '../../../../shared/infrastructure/services/shared-services.module';

@Module({
  providers: [{ provide: UserRoleRepository, useClass: PrismaRoleRepository }],
  exports: [UserRoleRepository],
  imports: [SharedServicesModule],
})
export class UserRolesRepositoriesModule {}
