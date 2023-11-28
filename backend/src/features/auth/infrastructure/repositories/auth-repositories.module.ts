import { Module } from '@nestjs/common';
import { AuthTokenRepository } from '../../domain/tokens/repositories/AuthTokenRepository';
import { PrismaAuthTokenRepository } from './prisma-auth-tokens-repository/prisma-auth-token-repository.service';
import { PrismaPermissionsRepository } from './prisma-permissions-repository/prisma-permissions-repository';
import { UserRolesRepositoriesModule } from '../../../roles/infrastructure/repositories/userRolesRepositoriesModule';

@Module({
  providers: [
    {
      provide: AuthTokenRepository,
      useClass: PrismaAuthTokenRepository,
    },
    PrismaPermissionsRepository,
  ],
  imports: [UserRolesRepositoriesModule],
  exports: [PrismaPermissionsRepository, AuthTokenRepository],
})
export class AuthRepositoriesModule {}
