import { Test, TestingModule } from "@nestjs/testing";
import { EnvironmentService } from "./environment-service";

describe("EnvironmentService", () => {
  let provider: EnvironmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvironmentService],
    }).compile();

    provider = module.get<EnvironmentService>(EnvironmentService);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
