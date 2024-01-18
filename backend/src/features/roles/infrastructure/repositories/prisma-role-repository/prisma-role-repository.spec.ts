import { Test, TestingModule } from "@nestjs/testing";
import { PrismaRoleRepository } from "./prisma-role-repository";

describe("PrismaRoleRepository", () => {
  let provider: PrismaRoleRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaRoleRepository],
    }).compile();

    provider = module.get<PrismaRoleRepository>(PrismaRoleRepository);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
