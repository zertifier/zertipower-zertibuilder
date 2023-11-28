import { Test, TestingModule } from '@nestjs/testing';
import { RemoveUserRoleAction } from './remove-user-role-action.service';

describe('RemoveRoleAction', () => {
  let provider: RemoveUserRoleAction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemoveUserRoleAction],
    }).compile();

    provider = module.get<RemoveUserRoleAction>(RemoveUserRoleAction);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
