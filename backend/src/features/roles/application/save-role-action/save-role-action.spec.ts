import { Test, TestingModule } from '@nestjs/testing';
import { SaveUserRoleAction } from './save-user-role-action.service';

describe('SaveRoleAction', () => {
  let provider: SaveUserRoleAction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaveUserRoleAction],
    }).compile();

    provider = module.get<SaveUserRoleAction>(SaveUserRoleAction);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
