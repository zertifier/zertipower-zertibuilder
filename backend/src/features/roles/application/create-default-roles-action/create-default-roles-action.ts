import { Injectable } from "@nestjs/common";
import { UserRoleRepository } from "../../domain/UserRoleRepository";
import { UserRole } from "../../domain/UserRole";
import { WinstonLogger } from "../../../../shared/infrastructure/services";
import { ApplicationError } from "../../../../shared/domain/error";

@Injectable()
export class CreateDefaultRolesAction {
  constructor(
    private roleRepository: UserRoleRepository,
    private logger: WinstonLogger
  ) {}

  async run() {
    this.logger.info("Creating default roles");
    try {
      await this.roleRepository.save(UserRole.admin(), UserRole.user());
    } catch (err) {
      if (err instanceof ApplicationError) {
        this.logger.info(err.message);
        if (err.metadata) {
          this.logger.info(`${err.metadata}`);
        }
        return;
      }

      if (err instanceof Error) {
        this.logger.info(err.message);
        return;
      }

      this.logger.log(`${err}`);
    }
  }
}
