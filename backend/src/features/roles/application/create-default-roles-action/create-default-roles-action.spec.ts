import { Test, TestingModule } from '@nestjs/testing';
import { CreateDefaultRolesAction } from './create-default-roles-action';

describe('CreateDefaultRolesAction', () => {
  let provider: CreateDefaultRolesAction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateDefaultRolesAction],
    }).compile();

    provider = module.get<CreateDefaultRolesAction>(CreateDefaultRolesAction);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
