import { Test, TestingModule } from "@nestjs/testing";
import { MustacheViewsService } from "./mustache-views.service";

describe("ViewsService", () => {
  let provider: MustacheViewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MustacheViewsService],
    }).compile();

    provider = module.get<MustacheViewsService>(MustacheViewsService);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
