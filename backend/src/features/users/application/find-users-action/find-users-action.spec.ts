import { Test, TestingModule } from "@nestjs/testing";
import { FindUsersAction } from "./find-users-action";

describe("FindUsersAction", () => {
  let provider: FindUsersAction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindUsersAction],
    }).compile();

    provider = module.get<FindUsersAction>(FindUsersAction);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
