import { Injectable } from "@nestjs/common";
import { AuthTokenRepository } from "../../../domain/tokens/repositories/AuthTokenRepository";
import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { User } from "../../../../users/domain/User";
import { PrismaService } from "../../../../../shared/infrastructure/services";
import { InfrastructureError } from "../../../../../shared/domain/error/common";
import { toPrismaFilters } from "../../../../../shared/infrastructure/prisma/criteria";
import { UserIdNotDefinedError } from "../../../../users/domain/UserId/UserIdNotDefinedError";

@Injectable()
export class PrismaAuthTokenRepository implements AuthTokenRepository {
  constructor(private prisma: PrismaService) {}

  async delete(criteria: Criteria): Promise<void> {
    try {
      await this.prisma.token.deleteMany({
        where: toPrismaFilters(criteria),
      });
    } catch (err) {
      throw new InfrastructureError("Error removing errors").withMetadata(err);
    }
  }

  async find(criteria: Criteria): Promise<Array<string>> {
    try {
      const tokens = await this.prisma.token.findMany({
        where: toPrismaFilters(criteria),
        take: criteria.limit.value || undefined,
        skip: criteria.offset.value || undefined,
      });
      return tokens.map((token) => token.token);
    } catch (err) {
      throw new InfrastructureError("Error finding errors").withMetadata(err);
    }
  }

  async save(jwt: string, user: User, expirationTime: Date): Promise<void> {
    if (!user.id) {
      throw new UserIdNotDefinedError();
    }

    try {
      await this.prisma.token.create({
        data: {
          token: jwt,
          user_id: user.id,
          expiration_time: expirationTime,
        },
      });
    } catch (err) {
      throw new InfrastructureError("Error saving token").withMetadata(err);
    }
  }
}
