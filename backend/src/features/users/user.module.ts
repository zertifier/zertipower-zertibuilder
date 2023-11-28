import { Module } from '@nestjs/common';
import { UserController } from './infrastructure/user-controller/user.controller';
import { UserRepositoriesModule } from './infrastructure/repositories/user-repositories.module';
import { UserActionsModule } from './application/user-actions.module';
import { AuthServicesModule } from '../auth/infrastructure/services/auth-services.module';
import { AuthRepositoriesModule } from '../auth/infrastructure/repositories/auth-repositories.module';

@Module({
  imports: [
    AuthServicesModule,
    AuthRepositoriesModule,
    UserRepositoriesModule,
    UserActionsModule,
  ],
  controllers: [UserController],
})
export class UserModule {}
