import { Module } from "@nestjs/common";
import { RemoveUserRoleAction } from "./remove-role-action/remove-user-role-action.service";
import { SharedServicesModule } from "../../../shared/infrastructure/services/shared-services.module";
import { UserRolesRepositoriesModule } from "../infrastructure/repositories/userRolesRepositoriesModule";
import { UpdateUserRoleAction } from "./update-role-action/update-user-role-action.service";
import { SaveUserRoleAction } from "./save-role-action/save-user-role-action.service";
import { CreateDefaultRolesAction } from "./create-default-roles-action/create-default-roles-action";

@Module({
  providers: [
    RemoveUserRoleAction,
    UpdateUserRoleAction,
    SaveUserRoleAction,
    CreateDefaultRolesAction,
  ],
  exports: [
    RemoveUserRoleAction,
    UpdateUserRoleAction,
    SaveUserRoleAction,
    CreateDefaultRolesAction,
  ],
  imports: [SharedServicesModule, UserRolesRepositoriesModule],
})
export class UserRolesActionsModule {}
