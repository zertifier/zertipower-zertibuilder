import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  PrismaService,
  WinstonLogger,
} from '../../../../shared/infrastructure/services';
import { SaveUserAction } from '../save-user-action/save-user-action';
import { User } from '../../domain/User';
import { UserRole } from '../../../roles/domain/UserRole';
import { CreateDefaultRolesAction } from '../../../roles/application/create-default-roles-action/create-default-roles-action';

/**
 * This task creates a default user in case there are no users when application starts
 */
@Injectable()
export class CreateDefaultUserTask implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private saveUserAction: SaveUserAction,
    private logger: WinstonLogger,
    private createDefaultRolesAction: CreateDefaultRolesAction,
  ) {}

  async onModuleInit(): Promise<any> {
    await this.createDefaultRolesAction.run();

    this.logger.info('Creating default user');
    const users = await this.prisma.user.findMany({ take: 1 });
    if (users.length !== 0) {
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        username: 'admin',
      },
    });
    if (!user) {
      // Create default user
      await this.saveUserAction.run(
        new User({
          username: 'admin',
          role: UserRole.admin(),
          password: '',
          email: 'admin@example.com',
          firstname: 'admin',
          lastname: 'admin',
        }),
      );
      return;
    }
  }
}
