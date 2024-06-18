import {Module} from '@nestjs/common';
import {CommunitiesController} from "./communities.controller";
import {AuthModule} from "../auth/auth.module";
import {AuthServicesModule} from "../auth/infrastructure/services/auth-services.module";
import {UserRepositoriesModule} from "../users/infrastructure/repositories/user-repositories.module";
import {AuthRepositoriesModule} from "../auth/infrastructure/repositories/auth-repositories.module";
import {SharedServicesModule} from "../../shared/infrastructure/services/shared-services.module";
import { CommunitiesStatsService } from './communities-stats/communities-stats.service';

@Module({
  controllers: [CommunitiesController],
  imports: [AuthModule, AuthServicesModule, UserRepositoriesModule, AuthRepositoriesModule, SharedServicesModule],
  providers: [CommunitiesStatsService]
})
export class CommunitiesModule {
}
