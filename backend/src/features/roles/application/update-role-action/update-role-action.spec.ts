import { Test, TestingModule } from "@nestjs/testing";
import { UpdateUserRoleAction } from "./update-user-role-action.service";

describe("UpdateRoleAction", () => {
  let provider: UpdateUserRoleAction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateUserRoleAction],
    }).compile();

    provider = module.get<UpdateUserRoleAction>(UpdateUserRoleAction);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
