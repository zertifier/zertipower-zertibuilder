import { Test, TestingModule } from '@nestjs/testing';
import { GenerateUserTokensAction } from './generate-user-tokens-action';

describe('GenerateUserTokensAction', () => {
  let provider: GenerateUserTokensAction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateUserTokensAction],
    }).compile();

    provider = module.get<GenerateUserTokensAction>(GenerateUserTokensAction);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
