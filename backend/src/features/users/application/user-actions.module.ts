import { Module } from "@nestjs/common";
import { FindUsersAction } from "./find-users-action/find-users-action";
import { SharedServicesModule } from "../../../shared/infrastructure/services/shared-services.module";
import { UserRepositoriesModule } from "../infrastructure/repositories/user-repositories.module";
import { SaveUserAction } from "./save-user-action/save-user-action";
import { CreateDefaultUserTask } from "./create-default-user-task/create-default-user-task.service";
import { UserRolesRepositoriesModule } from "src/features/roles/infrastructure/repositories/userRolesRepositoriesModule";
import { UserRolesActionsModule } from "../../roles/application/user-roles-actions.module";

@Module({
  providers: [FindUsersAction, SaveUserAction, CreateDefaultUserTask],
  exports: [FindUsersAction, SaveUserAction],
  imports: [
    UserRepositoriesModule,
    SharedServicesModule,
    UserRolesRepositoriesModule,
    UserRolesActionsModule,
  ],
})
export class UserActionsModule {}
