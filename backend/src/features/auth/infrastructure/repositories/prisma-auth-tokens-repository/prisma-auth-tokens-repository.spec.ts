import { Test, TestingModule } from "@nestjs/testing";
import { PrismaAuthTokenRepository } from "./prisma-auth-token-repository.service";

describe("AuthRepository", () => {
  let provider: PrismaAuthTokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaAuthTokenRepository],
    }).compile();

    provider = module.get<PrismaAuthTokenRepository>(PrismaAuthTokenRepository);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
