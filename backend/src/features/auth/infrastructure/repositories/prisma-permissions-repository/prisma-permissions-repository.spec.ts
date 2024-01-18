import { Test, TestingModule } from "@nestjs/testing";
import { PrismaPermissionsRepository } from "./prisma-permissions-repository";

describe("PrismaPermissionsRepository", () => {
  let provider: PrismaPermissionsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaPermissionsRepository],
    }).compile();

    provider = module.get<PrismaPermissionsRepository>(
      PrismaPermissionsRepository
    );
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
