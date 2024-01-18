import { Test, TestingModule } from "@nestjs/testing";
import { JoseJWTService } from "./JoseJWT.service";

describe("JwtService", () => {
  let provider: JoseJWTService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JoseJWTService],
    }).compile();

    provider = module.get<JoseJWTService>(JoseJWTService);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
