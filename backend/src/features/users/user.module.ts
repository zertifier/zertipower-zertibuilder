import { Module } from "@nestjs/common";
import { UserController } from "./infrastructure/user-controller/user.controller";
import { UserRepositoriesModule } from "./infrastructure/repositories/user-repositories.module";
import { UserActionsModule } from "./application/user-actions.module";
import { AuthServicesModule } from "../auth/infrastructure/services/auth-services.module";
import { AuthRepositoriesModule } from "../auth/infrastructure/repositories/auth-repositories.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthServicesModule,
    AuthRepositoriesModule,
    UserRepositoriesModule,
    UserActionsModule,
    AuthModule
  ],
  controllers: [UserController],
})
export class UserModule {}
