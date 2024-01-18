import { Module } from "@nestjs/common";
import { UserRepository } from "../../domain/UserRepository";
import { PrismaUserRepository } from "./prisma-user-repository/prisma-user-repository";

@Module({
  providers: [{ provide: UserRepository, useClass: PrismaUserRepository }],
  exports: [UserRepository],
})
export class UserRepositoriesModule {}
