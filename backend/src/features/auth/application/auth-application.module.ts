import { Module } from '@nestjs/common';
import { GenerateUserTokensAction } from './generate-user-tokens-action/generate-user-tokens-action';
import { AuthServicesModule } from '../infrastructure/services/auth-services.module';
import { AuthRepositoriesModule } from '../infrastructure/repositories/auth-repositories.module';
import { UserRolesRepositoriesModule } from '../../roles/infrastructure/repositories/userRolesRepositoriesModule';

@Module({
  providers: [GenerateUserTokensAction],
  exports: [GenerateUserTokensAction],
  imports: [
    AuthServicesModule,
    AuthRepositoriesModule,
    UserRolesRepositoriesModule,
  ],
})
export class AuthApplicationModule {}
