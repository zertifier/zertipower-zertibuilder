import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports/reports.controller';
import { PrismaReportsRepository } from './repositories/prisma-reports-repository/prisma-reports-repository';
import { SharedServicesModule } from '../../../shared/infrastructure/services/shared-services.module';
import { UserRepositoriesModule } from '../../users/infrastructure/repositories/user-repositories.module';
import { AuthServicesModule } from '../../auth/infrastructure/services/auth-services.module';
import { AuthRepositoriesModule } from '../../auth/infrastructure/repositories/auth-repositories.module';

@Module({
  imports: [
    SharedServicesModule,
    AuthServicesModule,
    AuthRepositoriesModule,
    UserRepositoriesModule,
  ],
  controllers: [ReportsController],
  providers: [PrismaReportsRepository],
  exports: [PrismaReportsRepository],
})
export class ReportsModule {}
