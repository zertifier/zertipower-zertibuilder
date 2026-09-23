import { RecoveryController } from "./credential-recovery/recovery.controller";
import { MysqlRecoveryStore } from "./credential-recovery/recovery-store";
import { ZertiauthVerifier } from "./credential-recovery/zertiauth-verifier";
import { Module } from "@nestjs/common";
import { AccessTokenGuard } from "./infrastructure/guards/access-token-guard/access-token-guard";
import { AuthController } from "./infrastructure/controllers/auth/auth.controller";
import { UserRepositoriesModule } from "../users/infrastructure/repositories/user-repositories.module";
import { UserActionsModule } from "../users/application/user-actions.module";
import { PermissionsController } from "./infrastructure/controllers/permissions/permissions.controller";
import { UserRolesRepositoriesModule } from "../roles/infrastructure/repositories/userRolesRepositoriesModule";
import { OauthController } from "./infrastructure/controllers/oauth/oauth.controller";
import { AuthApplicationModule } from "./application/auth-application.module";
import { AuthServicesModule } from "./infrastructure/services/auth-services.module";
import { AuthRepositoriesModule } from "./infrastructure/repositories/auth-repositories.module";

@Module({
  imports: [
    UserRepositoriesModule,
    UserActionsModule,
    UserRolesRepositoriesModule,
    AuthApplicationModule,
    AuthServicesModule,
    AuthRepositoriesModule,
  ],
  providers: [AccessTokenGuard, MysqlRecoveryStore, ZertiauthVerifier],
  controllers: [AuthController, PermissionsController, OauthController, RecoveryController],
  exports: [AccessTokenGuard],
})
export class AuthModule {}
